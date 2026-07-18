const { Op } = require("sequelize");
const { Route, User, FavoriteRoute } = require("../models");
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

const getFavoriteRouteRows = async (userId) => FavoriteRoute.findAll({
  where: { userId },
  include: [{
    model: Route,
    as: "route",
    attributes: ["id", "routeName", "from", "to"],
  }],
  order: [["addedAt", "DESC"]],
});

const migrateLegacyFavoriteRoutes = async (user) => {
  if (!user || user.role !== "passenger") return [];

  const existingFavorites = await FavoriteRoute.findAll({
    where: { userId: user.id },
    attributes: ["routeId"],
  });

  const legacyRouteIds = coerceRouteIdsArray(user.favoriteRoutes);
  if (!legacyRouteIds.length) return getFavoriteRouteRows(user.id);

  const existingRouteIdSet = new Set(existingFavorites.map((favorite) => favorite.routeId));
  const missingRouteIds = legacyRouteIds.filter((routeId) => !existingRouteIdSet.has(routeId));

  if (!missingRouteIds.length) return getFavoriteRouteRows(user.id);

  const now = new Date();
  await FavoriteRoute.bulkCreate(
    missingRouteIds.map((routeId) => ({ userId: user.id, routeId, addedAt: now })),
    { ignoreDuplicates: true }
  );

  return getFavoriteRouteRows(user.id);
};

const mapFavoriteRouteResponse = (favoriteRoute) => {
  const route = favoriteRoute.route || {};
  return {
    routeId: favoriteRoute.routeId,
    routeName: route.routeName || null,
    from: route.from || null,
    to: route.to || null,
    addedAt: favoriteRoute.addedAt,
  };
};
 
// ── CRUD ──────────────────────────────────────────────────────────────────────
 
const getAllUsers = async ({ page = 1, limit = 10, role, search, id, status } = {}) => {
  const offset = (page - 1) * limit;
  const where  = {};

  // Role filter
  if (role) where.role = role;

  // Status filter
  if (status === "active")   where.isActive = true;
  if (status === "inactive") where.isActive = false;

  // ID search takes priority over text search
  if (id) {
    const parsed = parseInt(id, 10);
    if (!isNaN(parsed)) where.id = parsed;
  } else if (search) {
    // Split search into parts to match across firstName + lastName
    const parts = search.trim().split(/\s+/);
    if (parts.length >= 2) {
      // e.g. "Hewa Wasam" → match firstName LIKE "Hewa" AND lastName LIKE "Wasam"
      where[Op.and] = [
        { firstName: { [Op.like]: `%${parts[0]}%` } },
        { lastName:  { [Op.like]: `%${parts.slice(1).join(" ")}%` } },
      ];
    } else {
      // Single word → search across firstName, lastName, email
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName:  { [Op.like]: `%${search}%` } },
        { email:     { [Op.like]: `%${search}%` } },
      ];
    }
  }

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
 
  const favoriteRoutes = await migrateLegacyFavoriteRoutes(user);
  const routes = favoriteRoutes.map(mapFavoriteRouteResponse);
 
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
 
  await migrateLegacyFavoriteRoutes(user);

  const [favoriteRoute] = await FavoriteRoute.findOrCreate({
    where: { userId: user.id, routeId: route.id },
    defaults: { userId: user.id, routeId: route.id },
  });

  await favoriteRoute.reload({
    include: [{
      model: Route,
      as: "route",
      attributes: ["id", "routeName", "from", "to"],
    }],
  });

  return mapFavoriteRouteResponse(favoriteRoute);
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
 
  await migrateLegacyFavoriteRoutes(user);

  await FavoriteRoute.destroy({
    where: {
      userId: user.id,
      routeId: route.id,
    },
  });

  return { routeId: route.id };
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