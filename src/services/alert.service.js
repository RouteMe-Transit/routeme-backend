const { Op } = require("sequelize");
const { Alert, User } = require("../models");
const ApiError = require("../utils/ApiError");

let schedulerTimer = null;
let schedulerRunning = false;

const BUS_ALERT_TYPE_MAP = {
  delay: "delay",
  weather: "weather",
  breakdown: "breakdown",
  "not operating": "not operating",
  not_operating: "not operating",
  accident: "accident",
  "road block": "road block",
  road_block: "road block",
};

const BUS_ALERT_TEMPLATES = { //need to update descriptions to be more dynamic based on route and bus info
  delay: {
    title: "Bus Delay Alert",
    description: (route) => `Bus service on route ${route} is delayed. Please expect a late arrival.`,
  },
  weather: {
    title: "Weather Alert",
    description: (route) =>
      `Bus service on route ${route} is affected by weather conditions. Please travel with caution.`,
  },
  breakdown: {
    title: "Bus Breakdown Alert",
    description: (route) =>
      `A bus operating on route ${route} has broken down. Replacement and recovery actions are in progress.`,
  },
  "not operating": {
    title: "Service Not Operating",
    description: (route) => `Bus service on route ${route} is currently not operating.`,
  },
  accident: {
    title: "Accident Alert",
    description: (route) =>
      `An accident has impacted bus service on route ${route}. Delays and temporary service disruption are expected.`,
  },
  "road block": {
    title: "Road Block Alert",
    description: (route) =>
      `A road block is affecting bus movement on route ${route}. Alternate routing and delays may occur.`,
  },
};

const getAlertById = async (id) => {// Admins can view any alert by ID, including scheduled and sent alerts
  const alert = await Alert.findByPk(id);
  if (!alert || alert.isDeleted) throw new ApiError(404, "Alert not found");
  return alert;
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
  return BUS_ALERT_TYPE_MAP[key] || null;
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

  if (hasSchedule && Number.isNaN(scheduleDate.getTime())) {
    throw new ApiError(422, "Invalid schedule date/time");
  }

  if (!normalizedAlertType) {
    throw new ApiError(422, "Invalid alert type");
  }

  const payload = {
    alertType: normalizedAlertType,
    affectedRoute: data.targetRoute || data.affectedRoute || null,
    affectedBus: data.affectedBus || null,
    title: data.title,
    description: data.description,
    targetAudience: data.targetAudience,
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

const createBusRouteAlert = async ({ alertType, busUser }) => {
  if (!busUser || busUser.role !== "bus") {
    throw new ApiError(403, "Only bus users can send bus alerts");
  }

  if (!busUser.assignedRoute) {
    throw new ApiError(422, "Bus user does not have an assignedRoute");
  }

  const normalizedAlertType = normalizeBusAlertType(alertType);
  if (!normalizedAlertType) {
    throw new ApiError(422, "Invalid alert type");
  }

  const template = BUS_ALERT_TEMPLATES[normalizedAlertType];
  const route = busUser.assignedRoute;

  const alert = await Alert.create({
    alertType: normalizedAlertType,
    affectedRoute: route,
    affectedBus: `${busUser.id}`,
    title: template.title,
    description: template.description(route),
    targetAudience: "route",
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

const getAlertHistoryByAdmin = async ({ page = 1, limit = 10, status, createdBy } = {}) => {
  const parsedPage = parseInt(page || 1, 10);
  const parsedLimit = parseInt(limit || 10, 10);
  const offset = (parsedPage - 1) * parsedLimit;

  const where = { isDeleted: false };
  if (status) where.status = status;
  if (createdBy) where.createdBy = createdBy;

  const { count, rows } = await Alert.findAndCountAll({
    where,
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

module.exports = {
  getAlertById,
  createAlert,
  createBusRouteAlert,
  getPassengerVisibleAlerts,
  getAlertHistoryByAdmin,
  getAlertHistoryByBus,
  initAlertScheduler,
};
