const { Op } = require("sequelize");
const { Alert, User, BusDetails, Route } = require("../models");
const ApiError = require("../utils/ApiError");

let schedulerTimer = null;
let schedulerRunning = false;

const buildAlertSearchConditions = (search) => {
  const searchText = `${search || ""}`.trim();
  const conditions = [
    { alertType: { [Op.like]: `%${searchText}%` } },
    { title: { [Op.like]: `%${searchText}%` } },
    { description: { [Op.like]: `%${searchText}%` } },
    { affectedRoute: { [Op.like]: `%${searchText}%` } },
    { affectedBus: { [Op.like]: `%${searchText}%` } },
  ];

  const numericMatch = searchText.match(/\d+/);
  if (numericMatch) {
    conditions.push({ id: Number(numericMatch[0]) });
  }

  return conditions;
};

const BUS_ALERT_TYPE_MAP = {
  delay: "delay",
  weather: "weather",
  breakdown: "breakdown",
  "not operating": "not operating",
  accident: "accident",
  "road block": "road block",
  not_operating: "not operating",
  road_block: "road block",
  "road-block": "road block",
  "service distruption": "service distruption",
  "service-distruption": "service distruption",
  "heavy rain": "heavy rain",
  "heavy-rain": "heavy rain",
  "damaged roads": "damaged roads",
  "damaged-roads": "damaged roads",
  "rule enforcement": "rule enforcement",
  "rule-enforcement": "rule enforcement",
  "new bus stop": "new bus stop",
  "new-bus-stop": "new bus stop",
  "removed bus stop": "removed bus stop",
  "removed-bus-stop": "removed bus stop",
  "route change": "route change",
  "route-change": "route change",
  "public events": "public events",
  "public-events": "public events",
  other: "other",
};

const BUS_ALERT_TEMPLATES = {
  delay: { title: "Bus Delay Alert" },
  weather: { title: "Weather Alert" },
  breakdown: { title: "Bus Breakdown Alert" },
  "not operating": { title: "Service Not Operating" },
  accident: { title: "Accident Alert" },
  "road block": { title: "Road Block Alert" },
};

const generateBusMessage = ({ alertType, affectedBus, affectedRoute }) => {
  const bus = `${affectedBus || "Bus service"}`.trim() || "Bus service";
  const route = `${affectedRoute || "Unknown route"}`.trim() || "Unknown route";
  const prefix = `${bus} on route ${route}`;

  switch (alertType) {
    case "not operating": return `${prefix} is currently not operating.`;
    case "delay":         return `${prefix} is currently delayed.`;
    case "breakdown":     return `${prefix} has experienced a breakdown.`;
    case "accident":      return `${prefix} has reported an accident.`;
    case "weather":       return `${prefix} is affected by severe weather conditions.`;
    case "road block":    return `${prefix} is affected due to a road block.`;
    default:              return `${prefix} has a service disruption.`;
  }
};

const normalizeBusAlertType = (alertType) => {
  const key = `${alertType || ""}`.trim().toLowerCase();
  if (BUS_ALERT_TYPE_MAP[key]) return BUS_ALERT_TYPE_MAP[key];
  const spaced = key.replace(/-/g, " ");
  return BUS_ALERT_TYPE_MAP[spaced] || null;
};

// ── Alert visibility (now based on favoriteRoutes) ────────────────────────────

const normalizeRouteKey = (route) => `${route || ""}`.trim().toLowerCase();

const getFavoriteRouteNames = async (user) => {
  const favoriteRouteIds = Array.isArray(user.favoriteRoutes) ? user.favoriteRoutes : [];
  if (!favoriteRouteIds.length) return [];

  const routes = await Route.findAll({
    where: { id: { [Op.in]: favoriteRouteIds } },
    attributes: ["routeName"],
  });

  return routes.map((r) => normalizeRouteKey(r.routeName));
};

const canPassengerViewAlert = async (passenger, alert) => {
  if (!passenger || passenger.role !== "passenger" || !alert) return false;
  if (alert.isDeleted || alert.status !== "sent") return false;
  if (alert.targetAudience === "public") return true;

  const favoriteRouteNames = await getFavoriteRouteNames(passenger);
  if (!favoriteRouteNames.length) return false;

  return favoriteRouteNames.includes(normalizeRouteKey(alert.affectedRoute));
};

const getAlertById = async (id, viewer = null) => {
  const alert = await Alert.findByPk(id);
  if (!alert || alert.isDeleted) throw new ApiError(404, "Alert not found");

  if (viewer?.role === "passenger") {
    const canView = await canPassengerViewAlert(viewer, alert);
    if (!canView) throw new ApiError(403, "You do not have permission to view this alert");

    const row = alert.toJSON ? alert.toJSON() : { ...alert };
    return {
      id: row.id,
      title: row.title,
      alertType: row.alertType,
      affectedBus: row.affectedBus,
      affectedRoute: row.affectedRoute,
      sentAt: row.sentAt,
      description: row.description,
    };
  }

  const alertWithCreator = await attachCreatorInfo(alert);
  return { ...alertWithCreator, createdBy: alertWithCreator?.createdByInfo || null };
};

const getPassengerVisibleAlerts = async ({ passenger, page = 1, limit = 10 } = {}) => {
  if (!passenger || passenger.role !== "passenger") {
    throw new ApiError(403, "Only passengers can access the alerts feed");
  }

  const parsedPage = parseInt(page || 1, 10);
  const parsedLimit = parseInt(limit || 10, 10);

  const favoriteRouteNames = await getFavoriteRouteNames(passenger);

  const alerts = await Alert.findAll({
    where: {
      isDeleted: false,
      status: "sent",
      targetAudience: { [Op.in]: ["public", "route"] },
    },
    order: [["createdAt", "DESC"]],
  });

  const visibleAlerts = alerts.filter((alert) => {
    if (alert.targetAudience === "public") return true;
    return favoriteRouteNames.includes(normalizeRouteKey(alert.affectedRoute));
  });

  const total = visibleAlerts.length;
  const offset = (parsedPage - 1) * parsedLimit;
  const paginatedAlerts = visibleAlerts.slice(offset, offset + parsedLimit);

  return {
    total,
    page: parsedPage,
    totalPages: Math.ceil(total / parsedLimit),
    alerts: paginatedAlerts,
  };
};

const getRecipientCount = async (alert) => {
  const baseWhere = { role: "passenger", isActive: true };

  if (alert.targetAudience === "public") {
    return User.count({ where: baseWhere });
  }

  const passengers = await User.findAll({
    where: baseWhere,
    attributes: ["id", "favoriteRoutes"],
  });

  const routeKey = normalizeRouteKey(alert.affectedRoute);

  // resolve all favorite route IDs to names in bulk
  const allFavIds = [...new Set(passengers.flatMap((p) => Array.isArray(p.favoriteRoutes) ? p.favoriteRoutes : []))];
  const routes = allFavIds.length
    ? await Route.findAll({ where: { id: { [Op.in]: allFavIds } }, attributes: ["id", "routeName"] })
    : [];
  const idToName = new Map(routes.map((r) => [r.id, normalizeRouteKey(r.routeName)]));

  return passengers.filter((user) => {
    const ids = Array.isArray(user.favoriteRoutes) ? user.favoriteRoutes : [];
    return ids.some((id) => idToName.get(id) === routeKey);
  }).length;
};

const resolveRouteTarget = async (routeValue) => {
  if (routeValue == null) return null;
  const normalizedValue = `${routeValue}`.trim();
  if (!normalizedValue) return null;

  const routeId = Number(normalizedValue);
  if (Number.isInteger(routeId) && `${routeId}` === normalizedValue) {
    const route = await Route.findByPk(routeId);
    if (!route) throw new ApiError(422, "Target route not found");
    return route.routeName || `${route.id}`;
  }

  return normalizedValue;
};

const sendAlertNow = async (alert) => {
  const recipientCount = await getRecipientCount(alert);
  await alert.update({
    status: "sent",
    sentAt: new Date(),
    recipientCount,
    deliveryMeta: {
      targetAudience: alert.targetAudience,
      affectedRoute: alert.affectedRoute || null,
      affectedBus: alert.affectedBus || null,
      dispatchedAt: new Date().toISOString(),
    },
  });
  return alert;
};

const createAlert = async (data, adminId) => {
  const now = new Date();
  const hasSchedule = !!data.scheduledAt;
  const scheduleDate = hasSchedule ? new Date(data.scheduledAt) : null;
  const normalizedAlertType = normalizeBusAlertType(data.alertType);
  const description = `${data.description || data.content || ""}`.trim();
  const targetRouteValue = data.targetRoute || data.affectedRoute || data.affectedBusOrRoute;
  const resolvedRoute = await resolveRouteTarget(targetRouteValue);
  const targetAudience = data.targetAudience || (resolvedRoute ? "route" : "public");

  if (hasSchedule && Number.isNaN(scheduleDate.getTime())) throw new ApiError(422, "Invalid schedule date/time");
  if (!normalizedAlertType) throw new ApiError(422, "Invalid alert type");

  const payload = {
    alertType: normalizedAlertType,
    affectedRoute: resolvedRoute,
    affectedBus: data.affectedBus || null,
    title: data.title,
    description,
    targetAudience,
    scheduledAt: hasSchedule ? scheduleDate : null,
    status: hasSchedule && scheduleDate > now ? "scheduled" : "sent",
    sentAt: hasSchedule && scheduleDate > now ? null : now,
    createdBy: adminId,
  };

  if (payload.targetAudience === "route" && !payload.affectedRoute) {
    throw new ApiError(422, "Affected route is required when target audience is route");
  }

  const alert = await Alert.create(payload);
  if (alert.status === "sent") await sendAlertNow(alert);
  return alert;
};

const createBusRouteAlert = async ({ alertType, busUser, title, description, affectedBus, affectedRoute, targetAudience }) => {
  if (!busUser || busUser.role !== "bus") throw new ApiError(403, "Only bus users can send bus alerts");

  const busDetails = await BusDetails.findOne({ where: { userId: busUser.id } });
  if (!busDetails) throw new ApiError(422, "Bus details not found for this user");

  const routeId = busDetails.routeId;
  if (!routeId) throw new ApiError(422, "Bus does not have an assigned route");

  const route = await Route.findByPk(routeId);
  if (!route) throw new ApiError(422, "Assigned route not found");

  const normalizedAlertType = normalizeBusAlertType(alertType);
  if (!normalizedAlertType) throw new ApiError(422, "Invalid alert type");

  const template = BUS_ALERT_TEMPLATES[normalizedAlertType];
  const routeName = `${affectedRoute || route.routeName || `Route ${routeId}`}`.trim();
  const busNumber = `${affectedBus || busDetails.registrationNumber || ""}`.trim() || null;
  const generatedDescription = generateBusMessage({ alertType: normalizedAlertType, affectedBus: busNumber, affectedRoute: routeName });
  const incomingDescription = typeof description === "string" ? description.trim() : "";
  const finalDescription = incomingDescription && busNumber && incomingDescription.includes(busNumber)
    ? incomingDescription
    : generatedDescription;

  const alert = await Alert.create({
    alertType: normalizedAlertType,
    affectedRoute: routeName,
    affectedBus: busNumber,
    title: `${title || template?.title || "Bus Alert"}`.trim(),
    description: finalDescription,
    targetAudience: targetAudience || "route",
    status: "sent",
    sentAt: new Date(),
    createdBy: busUser.id,
  });

  await sendAlertNow(alert);
  return alert;
};

const processDueAlerts = async () => {
  if (schedulerRunning) return;
  schedulerRunning = true;
  try {
    const dueAlerts = await Alert.findAll({
      where: { status: "scheduled", scheduledAt: { [Op.lte]: new Date() }, isDeleted: false },
      order: [["scheduledAt", "ASC"]],
      limit: 100,
    });
    for (const alert of dueAlerts) await sendAlertNow(alert);
  } finally {
    schedulerRunning = false;
  }
};

const initAlertScheduler = () => {
  if (schedulerTimer) return;
  schedulerTimer = setInterval(() => {
    processDueAlerts().catch((err) => console.error("Alert scheduler failed:", err));
  }, 30000);
  processDueAlerts().catch((err) => console.error("Alert scheduler failed on startup:", err));
};

const attachCreatorInfo = async (alertOrAlerts = []) => {
  const alerts = Array.isArray(alertOrAlerts) ? alertOrAlerts : [alertOrAlerts];
  if (!alerts.length || !alerts[0]) return Array.isArray(alertOrAlerts) ? [] : null;

  const creatorIds = [...new Set(alerts.map((a) => a.createdBy).filter(Boolean))];
  if (!creatorIds.length) {
    const mapped = alerts.map((alert) => {
      const row = alert.toJSON ? alert.toJSON() : { ...alert };
      row.createdByInfo = { role: "unknown", id: row.createdBy || null };
      return row;
    });
    return Array.isArray(alertOrAlerts) ? mapped : mapped[0];
  }

  const creators = await User.findAll({
    where: { id: { [Op.in]: creatorIds } },
    attributes: ["id", "firstName", "lastName", "role"],
  });

  const creatorMap = new Map(creators.map((u) => [u.id, u]));
  const busUserIds = creators.filter((u) => u.role === "bus").map((u) => u.id);
  const busDetails = busUserIds.length
    ? await BusDetails.findAll({ where: { userId: { [Op.in]: busUserIds } }, attributes: ["userId", "registrationNumber"] })
    : [];
  const busRegMap = new Map(busDetails.map((b) => [b.userId, b.registrationNumber]));

  const mapped = alerts.map((alert) => {
    const row = alert.toJSON ? alert.toJSON() : { ...alert };
    const creator = creatorMap.get(row.createdBy);

    if (!creator) {
      row.createdByInfo = { role: "unknown", id: row.createdBy || null };
      return row;
    }

    if (creator.role === "admin") {
      const adminName = `${creator.firstName || ""} ${creator.lastName || ""}`.trim();
      row.createdByInfo = { role: "admin", id: creator.id, name: adminName || null, displayName: adminName || null };
      return row;
    }

    if (creator.role === "bus") {
      const reg = busRegMap.get(creator.id) || row.affectedBus || null;
      row.createdByInfo = { role: "bus", id: creator.id, name: reg, registrationNumber: reg, displayName: reg };
      return row;
    }

    row.createdByInfo = { role: creator.role, id: creator.id };
    return row;
  });

  return Array.isArray(alertOrAlerts) ? mapped : mapped[0];
};

const buildAlertHistoryWhere = async ({ status, createdBy, creatorRole, alertType, affectedRoute, search } = {}) => {
  const where = { isDeleted: false };
  let creatorIdFilter = null;

  if (status) where.status = status;
  if (alertType) where.alertType = `${alertType}`.trim().toLowerCase();
  if (affectedRoute) where.affectedRoute = { [Op.like]: `%${`${affectedRoute}`.trim()}%` };
  if (search) where[Op.or] = buildAlertSearchConditions(search);

  if (creatorRole) {
    const creatorIds = await User.findAll({
      where: { role: `${creatorRole}`.trim().toLowerCase() },
      attributes: ["id"],
    }).then((users) => users.map((u) => u.id));
    if (!creatorIds.length) return null;
    creatorIdFilter = creatorIds;
  }

  if (createdBy) {
    const parsedCreatedBy = parseInt(createdBy, 10);
    if (Number.isNaN(parsedCreatedBy)) return null;
    if (creatorIdFilter && !creatorIdFilter.includes(parsedCreatedBy)) return null;
    where.createdBy = parsedCreatedBy;
    return where;
  }

  if (creatorIdFilter) where.createdBy = { [Op.in]: creatorIdFilter };
  return where;
};

const getAlertHistoryByAdmin = async ({ page = 1, limit = 10, status, createdBy, creatorRole, search } = {}) => {
  const parsedPage = parseInt(page || 1, 10);
  const parsedLimit = parseInt(limit || 10, 10);
  const offset = (parsedPage - 1) * parsedLimit;

  const adminUsers = await User.findAll({ where: { role: "admin" }, attributes: ["id"] });
  const adminIds = adminUsers.map((u) => u.id);

  if (!adminIds.length) return { total: 0, page: parsedPage, totalPages: 0, alerts: [] };

  const where = { isDeleted: false, createdBy: { [Op.in]: adminIds } };
  if (status) where.status = status;
  if (search) where[Op.or] = buildAlertSearchConditions(search);
  if (createdBy) {
    const requestedCreatorId = parseInt(createdBy, 10);
    if (Number.isNaN(requestedCreatorId) || !adminIds.includes(requestedCreatorId)) {
      return { total: 0, page: parsedPage, totalPages: 0, alerts: [] };
    }
    where.createdBy = requestedCreatorId;
  }

  const { count, rows } = await Alert.findAndCountAll({ where, limit: parsedLimit, offset, order: [["createdAt", "DESC"]] });
  const alerts = await attachCreatorInfo(rows);
  return { total: count, page: parsedPage, totalPages: Math.ceil(count / parsedLimit), alerts };
};

const getAlertHistoryAllForAdmin = async ({ page = 1, limit = 10, status, createdBy, creatorRole, alertType, affectedRoute, search } = {}) => {
  const parsedPage = parseInt(page || 1, 10);
  const parsedLimit = parseInt(limit || 10, 10);
  const offset = (parsedPage - 1) * parsedLimit;

  const where = await buildAlertHistoryWhere({ status, createdBy, creatorRole, alertType, affectedRoute, search });
  if (!where) return { total: 0, page: parsedPage, totalPages: 0, alerts: [] };

  const { count, rows } = await Alert.findAndCountAll({ where, limit: parsedLimit, offset, order: [["createdAt", "DESC"]] });
  const alerts = await attachCreatorInfo(rows);
  return { total: count, page: parsedPage, totalPages: Math.ceil(count / parsedLimit), alerts };
};

const getAlertHistoryByBus = async ({ page = 1, limit = 10, busId } = {}) => {
  const parsedPage = parseInt(page || 1, 10);
  const parsedLimit = parseInt(limit || 10, 10);
  const offset = (parsedPage - 1) * parsedLimit;

  const { count, rows } = await Alert.findAndCountAll({
    where: { isDeleted: false, createdBy: busId, targetAudience: "route" },
    limit: parsedLimit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return { total: count, page: parsedPage, totalPages: Math.ceil(count / parsedLimit), alerts: rows };
};

module.exports = {
  getAlertById,
  createAlert,
  createBusRouteAlert,
  generateBusMessage,
  getPassengerVisibleAlerts,
  getAlertHistoryByAdmin,
  getAlertHistoryAllForAdmin,
  getAlertHistoryByBus,
  initAlertScheduler,
};