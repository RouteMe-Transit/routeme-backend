const { Op } = require("sequelize");
const { Alert, User } = require("../models");
const ApiError = require("../utils/ApiError");

let schedulerTimer = null;
let schedulerRunning = false;

const getAlertById = async (id) => {
  const alert = await Alert.findByPk(id);
  if (!alert || alert.isDeleted) throw new ApiError(404, "Alert not found");
  return alert;
};

const normalizeRouteKey = (route) => {
  if (!route) return "";
  return `${route}`.trim().toLowerCase();
};

const userSubscribedToRoute = (user, route) => {
  const routeKey = normalizeRouteKey(route);
  if (!routeKey) return false;

  if (!Array.isArray(user.subscribedRoutes) || user.subscribedRoutes.length === 0) {
    return false;
  }

  return user.subscribedRoutes.some((subscribedRoute) => normalizeRouteKey(subscribedRoute) === routeKey);
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

  if (hasSchedule && Number.isNaN(scheduleDate.getTime())) {
    throw new ApiError(422, "Invalid schedule date/time");
  }

  const payload = {
    alertType: data.alertType,
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
  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);
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

module.exports = {
  getAlertById,
  createAlert,
  getAlertHistoryByAdmin,
  initAlertScheduler,
};
