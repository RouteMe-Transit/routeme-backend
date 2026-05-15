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
  // common canonical forms
  delay: "delay",
  weather: "weather",
  breakdown: "breakdown",
  "not operating": "not operating",
  accident: "accident",
  "road block": "road block",
  // variant forms the UI might send
  not_operating: "not operating",
  "road_block": "road block",
  "road-block": "road block",
  "service distruption": "service distruption",
  "service-distruption": "service distruption",
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

const BUS_ALERT_TEMPLATES = { //need to update descriptions to be more dynamic based on route and bus info
  delay: {
    title: "Bus Delay Alert",
  },
  weather: {
    title: "Weather Alert",
  },
  breakdown: {
    title: "Bus Breakdown Alert",
  },
  "not operating": {
    title: "Service Not Operating",
  },
  accident: {
    title: "Accident Alert",
  },
  "road block": {
    title: "Road Block Alert",
  },
};

const generateBusMessage = ({ alertType, affectedBus, affectedRoute }) => {
  const bus = `${affectedBus || "Bus service"}`.trim() || "Bus service";
  const route = `${affectedRoute || "Unknown route"}`.trim() || "Unknown route";
  const prefix = `${bus} on route ${route}`;

  switch (alertType) {
    case "not operating":
      return `${prefix} is currently not operating.`;
    case "delay":
      return `${prefix} is currently delayed.`;
    case "breakdown":
      return `${prefix} has experienced a breakdown.`;
    case "accident":
      return `${prefix} has reported an accident.`;
    case "weather":
      return `${prefix} is affected by severe weather conditions.`;
    case "road block":
      return `${prefix} is affected due to a road block.`;
    default:
      return `${prefix} has a service disruption.`;
  }
};

const getAlertById = async (id) => {// Admins can view any alert by ID, including scheduled and sent alerts
  const alert = await Alert.findByPk(id);
  if (!alert || alert.isDeleted) throw new ApiError(404, "Alert not found");
  const alertWithCreator = await attachCreatorInfo(alert);

  return {
    ...alertWithCreator,
    createdBy: alertWithCreator?.createdByInfo || null,
  };
};

const normalizeRouteKey = (route) => {
  if (!route) return "";
  return `${route}`.trim().toLowerCase();
};

const getSubscribedRoutesArray = (subscribedRoutes) => {
  if (Array.isArray(subscribedRoutes)) return subscribedRoutes;

  if (typeof subscribedRoutes === "string") {
    try {
      const parsed = JSON.parse(subscribedRoutes);
      if (Array.isArray(parsed)) return parsed;
      return [parsed];
    } catch (_) {
      return [];
    }
  }

  return [];
};

const normalizeBusAlertType = (alertType) => {
  const key = `${alertType || ""}`.trim().toLowerCase();
  // Try direct lookup first
  if (BUS_ALERT_TYPE_MAP[key]) {
    return BUS_ALERT_TYPE_MAP[key];
  }
  // If hyphenated, try with spaces
  const spaced = key.replace(/-/g, ' ');
  return BUS_ALERT_TYPE_MAP[spaced] || null;
};

const userSubscribedToRoute = (user, route) => {// Check if a passenger user is subscribed to a specific route (used for determining alert visibility)
  const routeKey = normalizeRouteKey(route);
  if (!routeKey) return false;// If the alert doesn't specify a route, it's not route-specific and shouldn't be filtered out

  const subscribedRoutes = getSubscribedRoutesArray(user.subscribedRoutes);// Normalize and check if any of the user's subscribed routes match the alert's affected route
  if (subscribedRoutes.length === 0) {// If the user has no subscribed routes, they shouldn't see route-specific alerts
    return false;
  }

  return subscribedRoutes.some((subscribedRoute) => normalizeRouteKey(subscribedRoute) === routeKey);// If any of the user's subscribed routes match the alert's affected route, the user should see the alert
};

const getPassengerVisibleAlerts = async ({ passenger, page = 1, limit = 10 } = {}) => {
  if (!passenger || passenger.role !== "passenger") {
    throw new ApiError(403, "Only passengers can access the alerts feed");
  }

  const parsedPage = parseInt(page || 1, 10);
  const parsedLimit = parseInt(limit || 10, 10);
  const routeKeys = getSubscribedRoutesArray(passenger.subscribedRoutes)
    .map((route) => normalizeRouteKey(route))
    .filter(Boolean);

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
    return routeKeys.some((routeKey) => normalizeRouteKey(alert.affectedRoute) === routeKey);
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
    attributes: ["id", "subscribedRoutes"],
  });

  return passengers.filter((user) => userSubscribedToRoute(user, alert.affectedRoute)).length;
};

const resolveRouteTarget = async (routeValue) => {
  if (routeValue == null) return null;

  const normalizedValue = `${routeValue}`.trim();
  if (!normalizedValue) return null;

  const routeId = Number(normalizedValue);
  if (Number.isInteger(routeId) && `${routeId}` === normalizedValue) {
    const route = await Route.findByPk(routeId);
    if (!route) {
      throw new ApiError(422, "Target route not found");
    }

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

  if (hasSchedule && Number.isNaN(scheduleDate.getTime())) {
    throw new ApiError(422, "Invalid schedule date/time");
  }

  if (!normalizedAlertType) {
    throw new ApiError(422, "Invalid alert type");
  }

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

  if (alert.status === "sent") {
    await sendAlertNow(alert);
  }

  return alert;
};

const createBusRouteAlert = async ({
  alertType,
  busUser,
  title,
  description,
  affectedBus,
  affectedRoute,
  targetAudience,
  targetRoute,
}) => {
  if (!busUser || busUser.role !== "bus") {
    throw new ApiError(403, "Only bus users can send bus alerts");
  }

  // Find BusDetails for this bus user
  const busDetails = await BusDetails.findOne({ where: { userId: busUser.id } });
  if (!busDetails) {
    throw new ApiError(422, "Bus details not found for this user");
  }

  // Get the assigned route ID
  const routeId = busDetails.routeId;
  if (!routeId) {
    throw new ApiError(422, "Bus does not have an assigned route");
  }

  // Fetch the route details
  const route = await Route.findByPk(routeId);
  if (!route) {
    throw new ApiError(422, "Assigned route not found");
  }

  const normalizedAlertType = normalizeBusAlertType(alertType);
  if (!normalizedAlertType) {
    throw new ApiError(422, "Invalid alert type");
  }

  const template = BUS_ALERT_TEMPLATES[normalizedAlertType];
  const routeName = `${affectedRoute || route.routeName || `Route ${routeId}`}`.trim();
  const busNumber = `${affectedBus || busDetails.registrationNumber || ""}`.trim() || null;
  const generatedDescription = generateBusMessage({
    alertType: normalizedAlertType,
    affectedBus: busNumber,
    affectedRoute: routeName,
  });
  const incomingDescription = typeof description === "string" ? description.trim() : "";
  const finalDescription =
    incomingDescription && busNumber && incomingDescription.includes(busNumber)
      ? incomingDescription
      : generatedDescription;
  const resolvedTargetAudience = targetAudience || "route";

  const alert = await Alert.create({
    alertType: normalizedAlertType,
    affectedRoute: routeName,
    affectedBus: busNumber,
    title: `${title || template?.title || "Bus Alert"}`.trim(),
    description: finalDescription,
    targetAudience: resolvedTargetAudience,
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
      where: {
        status: "scheduled",
        scheduledAt: { [Op.lte]: new Date() },
        isDeleted: false,
      },
      order: [["scheduledAt", "ASC"]],
      limit: 100,
    });

    for (const alert of dueAlerts) {
      await sendAlertNow(alert);
    }
  } finally {
    schedulerRunning = false;
  }
};

const initAlertScheduler = () => {
  if (schedulerTimer) return;

  schedulerTimer = setInterval(() => {
    processDueAlerts().catch((err) => {
      console.error("Alert scheduler failed:", err);
    });
  }, 30000);

  processDueAlerts().catch((err) => {
    console.error("Alert scheduler failed on startup:", err);
  });
};

const getAlertHistoryByAdmin = async ({ page = 1, limit = 10, status, createdBy, search } = {}) => {
  const parsedPage = parseInt(page || 1, 10);
  const parsedLimit = parseInt(limit || 10, 10);
  const offset = (parsedPage - 1) * parsedLimit;

  const adminUsers = await User.findAll({
    where: { role: "admin" },
    attributes: ["id"],
  });

  const adminIds = adminUsers.map((user) => user.id);

  if (!adminIds.length) {
    return {
      total: 0,
      page: parsedPage,
      totalPages: 0,
      alerts: []
    };
  }

  const where = { isDeleted: false, createdBy: { [Op.in]: adminIds } };
  if (status) where.status = status;
  if (search) {
    where[Op.or] = buildAlertSearchConditions(search);
  }
  if (createdBy) {
    const requestedCreatorId = parseInt(createdBy, 10);
    if (Number.isNaN(requestedCreatorId) || !adminIds.includes(requestedCreatorId)) {
      return {
        total: 0,
        page: parsedPage,
        totalPages: 0,
        alerts: []
      };
    }

    where.createdBy = requestedCreatorId;
  }

  const { count, rows } = await Alert.findAndCountAll({
    where,
    limit: parsedLimit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  const alerts = await attachCreatorInfo(rows);

  return {
    total: count,
    page: parsedPage,
    totalPages: Math.ceil(count / parsedLimit),
    alerts,
  };
};

const getAlertHistoryByBus = async ({ page = 1, limit = 10, busId } = {}) => {
  const parsedPage = parseInt(page || 1, 10);
  const parsedLimit = parseInt(limit || 10, 10);
  const offset = (parsedPage - 1) * parsedLimit;

  const { count, rows } = await Alert.findAndCountAll({
    where: {
      isDeleted: false,
      createdBy: busId,
      targetAudience: "route",
    },
    limit: parsedLimit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    total: count,
    page: parsedPage,
    totalPages: Math.ceil(count / parsedLimit),
    alerts: rows,
  };
};

const attachCreatorInfo = async (alertOrAlerts = []) => {
  const alerts = Array.isArray(alertOrAlerts) ? alertOrAlerts : [alertOrAlerts];

  if (!alerts.length || !alerts[0]) {
    return Array.isArray(alertOrAlerts) ? [] : null;
  }

  const creatorIds = [...new Set(alerts.map((alert) => alert.createdBy).filter(Boolean))];
  if (!creatorIds.length) {
    const mappedAlerts = alerts.map((alert) => {
      const row = alert.toJSON ? alert.toJSON() : { ...alert };
      row.createdByInfo = {
        role: "unknown",
        id: row.createdBy || null,
      };
      return row;
    });

    return Array.isArray(alertOrAlerts) ? mappedAlerts : mappedAlerts[0];
  }

  const creators = await User.findAll({
    where: { id: { [Op.in]: creatorIds } },
    attributes: ["id", "firstName", "lastName", "role"],
  });

  const creatorMap = new Map(creators.map((user) => [user.id, user]));
  const busUserIds = creators.filter((user) => user.role === "bus").map((user) => user.id);

  const busDetails = busUserIds.length
    ? await BusDetails.findAll({
      where: { userId: { [Op.in]: busUserIds } },
      attributes: ["userId", "registrationNumber"],
    })
    : [];

  const busRegMap = new Map(busDetails.map((bus) => [bus.userId, bus.registrationNumber]));

  const mappedAlerts = alerts.map((alert) => {
    const row = alert.toJSON ? alert.toJSON() : { ...alert };
    const creator = creatorMap.get(row.createdBy);

    if (!creator) {
      row.createdByInfo = {
        role: "unknown",
        id: row.createdBy || null,
      };
      return row;
    }

    if (creator.role === "admin") {
      const adminName = `${creator.firstName || ""} ${creator.lastName || ""}`.trim();
      row.createdByInfo = {
        role: "admin",
        id: creator.id,
        name: adminName || null,
        displayName: adminName || null,
      };
      return row;
    }

    if (creator.role === "bus") {
      const registrationNumber = busRegMap.get(creator.id) || row.affectedBus || null;
      row.createdByInfo = {
        role: "bus",
        id: creator.id,
        name: registrationNumber,
        registrationNumber,
        displayName: registrationNumber,
      };
      return row;
    }

    row.createdByInfo = {
      role: creator.role,
      id: creator.id,
    };
    return row;
  });

  return Array.isArray(alertOrAlerts) ? mappedAlerts : mappedAlerts[0];
};

const getAlertHistoryAllForAdmin = async ({ page = 1, limit = 10, status, createdBy, search } = {}) => {
  const parsedPage = parseInt(page || 1, 10);
  const parsedLimit = parseInt(limit || 10, 10);
  const offset = (parsedPage - 1) * parsedLimit;

  const where = { isDeleted: false };
  if (status) where.status = status;
  if (search) {
    where[Op.or] = buildAlertSearchConditions(search);
  }
  if (createdBy) {
    const parsedCreatedBy = parseInt(createdBy, 10);
    if (Number.isNaN(parsedCreatedBy)) {
      return {
        total: 0,
        page: parsedPage,
        totalPages: 0,
        alerts: [],
      };
    }
    where.createdBy = parsedCreatedBy;
  }

  const { count, rows } = await Alert.findAndCountAll({
    where,
    limit: parsedLimit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  const alerts = await attachCreatorInfo(rows);

  return {
    total: count,
    page: parsedPage,
    totalPages: Math.ceil(count / parsedLimit),
    alerts,
  };
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
