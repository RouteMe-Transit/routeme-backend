const { User } = require("../models");
const ApiError = require("../utils/ApiError");
 
// ── Route helpers ─────────────────────────────────────────────────────────────
 
const normalizeRouteValue = (route) => `${route || ""}`.trim();
const normalizeRouteKey   = (route) => normalizeRouteValue(route).toLowerCase();
 
const uniqueRoutes = (routes = []) => {
  const result = [];
  const seen = new Set();
  for (const route of routes) {
    const value = normalizeRouteValue(route);
    if (!value) continue;
    const key = normalizeRouteKey(value);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
};
 
const coerceRoutesArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (_) {
      return [trimmed];
    }
  }
  return [];
};
 
const isRouteIdValue = (value) => {
  const normalizedValue = normalizeRouteValue(value);
  if (!normalizedValue) return false;
  const parsed = Number(normalizedValue);
  return Number.isInteger(parsed) && parsed > 0 && `${parsed}` === normalizedValue;
};
 
const normalizeRouteId = (value) => {
  if (!isRouteIdValue(value)) return null;
  return Number(normalizeRouteValue(value));
};
 
const uniqueRouteIds = (routes = []) => {
  const result = [];
  const seen = new Set();
  for (const route of routes) {
    const routeId = normalizeRouteId(route);
    if (!routeId || seen.has(routeId)) continue;
    seen.add(routeId);
    result.push(routeId);
  }
  return result;
};
 
const coerceRouteIdsArray = (value) => uniqueRouteIds(coerceRoutesArray(value));
 
const resolveRoutesFromInputs = async (routes = [], { strict = true } = {}) => {
  const inputs = coerceRoutesArray(routes);
  if (!inputs.length) return [];
 
  const routeIds = uniqueRouteIds(inputs);
  const routeNames = uniqueRoutes(inputs.filter((value) => !isRouteIdValue(value)));
 
  const foundRoutes = [];
 
  if (routeIds.length) {
    const routesById = await Route.findAll({
      where: { id: { [Op.in]: routeIds } },
      attributes: ["id", "routeName"],
    });
    foundRoutes.push(...routesById);
  }
 
  if (routeNames.length) {
    const routesByName = await Route.findAll({
      where: { routeName: { [Op.in]: routeNames } },
      attributes: ["id", "routeName"],
    });
    foundRoutes.push(...routesByName);
  }
 
  const uniqueFoundRoutes = [];
  const seenIds = new Set();
  for (const route of foundRoutes) {
    if (seenIds.has(route.id)) continue;
    seenIds.add(route.id);
    uniqueFoundRoutes.push(route);
  }
 
  const foundIdSet = new Set(uniqueFoundRoutes.map((route) => route.id));
  const foundNameSet = new Set(uniqueFoundRoutes.map((route) => normalizeRouteKey(route.routeName)));
 
  const missingRouteIds = routeIds.filter((routeId) => !foundIdSet.has(routeId));
  const missingRouteNames = routeNames.filter((routeName) => !foundNameSet.has(normalizeRouteKey(routeName)));
 
  if (strict && (missingRouteIds.length || missingRouteNames.length)) {
    const missingValue = missingRouteIds[0] ?? missingRouteNames[0];
    throw new ApiError(404, `Route not found (${missingValue})`);
  }
 
  return uniqueFoundRoutes;
};
 
// ── CRUD ──────────────────────────────────────────────────────────────────────

const getAllUsers = async ({ page = 1, limit = 10, role } = {}) => {
  const offset = (page - 1) * limit;
  const where  = {};

  // role filter
  if (role) where.role = role;

  // status filter — "active" → isActive: true, "inactive" → isActive: false
  if (status === "active")   where.isActive = true;
  if (status === "inactive") where.isActive = false;

  // id filter — exact match, takes priority over text search
  if (id) {
    where.id = parseInt(id, 10);
  } else if (search && search.trim() !== "") {
    // search filter — matches firstName, lastName, or email
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { firstName: { [Op.like]: term } },
      { lastName:  { [Op.like]: term } },
      { email:     { [Op.like]: term } },
    ];
  }

  // role filter
  if (role) where.role = role;

  const { count, rows } = await User.findAndCountAll({
    where,
    limit:  parseInt(limit),
    offset: parseInt(offset),
    order:  [["createdAt", "DESC"]],
  });
 
  return {
    total:      count,
    page:       parseInt(page),
    totalPages: Math.ceil(count / limit),
    users:      rows,
  };
};
 
const getUserById = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new ApiError(404, "User not found");
  return user;
};
 
const getUserByEmail = async (email) =>
  User.scope("withPassword").findOne({ where: { email } });
 
const getUserByPhone = async (phone) =>
  User.scope("withPassword").findOne({ where: { phone } });
 
const createUser = async (data, options = {}) => {
  const { createdByAdmin = false } = options;
 
  const existingEmail = await User.findOne({ where: { email: data.email } });
  if (existingEmail) throw new ApiError(409, "Email already in use");
 
  if (data.phone) {
    const existingPhone = await User.findOne({ where: { phone: data.phone } });
    if (existingPhone) throw new ApiError(409, "Phone already in use");
  }
 
  const payload = {
    firstName: data.firstName,
    lastName:  data.lastName,
    email:     data.email,
    phone:     data.phone,
    password:  data.password,
    isActive:  data.isActive,
  };
 
  if (createdByAdmin) {
    if (!["admin", "bus"].includes(data.role)) {
      throw new ApiError(422, "Admin can only create admin or bus accounts");
    }
    payload.role = data.role;
  } else {
    payload.role = "passenger";
  }
 
  return User.create(payload);
};
 
const updateUser = async (id, data) => {
  const user = await getUserById(id);
 
  if (data.email && data.email !== user.email) {
    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) throw new ApiError(409, "Email already in use");
  }
 
  if (data.phone && data.phone !== user.phone) {
    const existing = await User.findOne({ where: { phone: data.phone } });
    if (existing) throw new ApiError(409, "Phone already in use");
  }
 
  await user.update({
    firstName: data.firstName,
    lastName:  data.lastName,
    email:     data.email,
    phone:     data.phone,
    password:  data.password,
    role:      data.role,
    isActive:  data.isActive,
  });
 
  return user;
};
 
// ── Favourite routes ──────────────────────────────────────────────────────────
 
const getPassengerFavoriteRoutes = async (userId, { search } = {}) => {
  const user = await getUserById(userId);
  if (user.role !== "passenger") {
    throw new ApiError(403, "Only passengers can access favorite routes");
  }
 
  const routeIds = coerceRouteIdsArray(user.favoriteRoutes);
  const routes = await resolveRoutesFromInputs(routeIds, { strict: false });
 
  const searchText = `${search || ""}`.trim().toLowerCase();
  const filteredRoutes = searchText
    ? routes.filter((route) => {
        const haystack = [route.routeName, route.from, route.to].map((v) => `${v || ""}`.toLowerCase());
        return haystack.some((v) => v.includes(searchText));
      })
    : routes;
 
  return {
    total: filteredRoutes.length,
    routes: filteredRoutes,
  };
};
 
const addPassengerFavoriteRoute = async (userId, routeId) => {
  const user = await getUserById(userId);
  if (user.role !== "passenger") {
    throw new ApiError(403, "Only passengers can update favorite routes");
  }
 
  const normalizedRouteId = normalizeRouteId(routeId);
  if (!normalizedRouteId) {
    throw new ApiError(422, "routeId must be a positive integer");
  }
 
  const route = await Route.findByPk(normalizedRouteId, { attributes: ["id", "routeName"] });
  if (!route) {
    throw new ApiError(404, "Route not found");
  }
 
  const favoriteRoutes = uniqueRouteIds([...coerceRouteIdsArray(user.favoriteRoutes), route.id]);
  await user.update({ favoriteRoutes });
  return user;
};
 
const removePassengerFavoriteRoute = async (userId, routeId) => {
  const user = await getUserById(userId);
  if (user.role !== "passenger") {
    throw new ApiError(403, "Only passengers can update favorite routes");
  }
 
  const normalizedRouteId = normalizeRouteId(routeId);
  if (!normalizedRouteId) {
    throw new ApiError(422, "routeId must be a positive integer");
  }
 
  const route = await Route.findByPk(normalizedRouteId, { attributes: ["id", "routeName"] });
  if (!route) {
    throw new ApiError(404, "Route not found");
  }
 
  const favoriteRoutes = coerceRouteIdsArray(user.favoriteRoutes).filter((id) => id !== route.id);
  await user.update({ favoriteRoutes });
  return user;
};
 
const deleteUser = async (id) => {
  const user = await getUserById(id);
  await user.update({ isActive: false });
};
 
module.exports = {
  getAllUsers,
  getUserById,
  getUserByEmail,
  getUserByPhone,
  createUser,
  updateUser,
  getPassengerFavoriteRoutes,
  addPassengerFavoriteRoute,
  removePassengerFavoriteRoute,
  deleteUser,
};
 
