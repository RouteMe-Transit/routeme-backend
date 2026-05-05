const { Op } = require("sequelize");
const { Trip, Route, BusDetails } = require("../models");
const ApiError = require("../utils/ApiError");

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateTripId = async () => {
  const last = await Trip.findOne({ order: [["id", "DESC"]] });
  const next  = last ? parseInt(last.tripId.split("-")[1]) + 1 : 1;
  return `TR-${String(next).padStart(3, "0")}`;
};

const includeRelations = [
  { model: Route,      as: "route", attributes: ["id", "routeName", "from", "to"] },
  { model: BusDetails, as: "bus",   attributes: ["id", "registrationNumber", "busType"] },
];

// ── Service methods ───────────────────────────────────────────────────────────

const getAll = async ({ page = 1, limit = 20, search, status, routeId, day } = {}) => {
  const where = {};

  if (status)  where.status  = status;
  if (routeId) where.routeId = parseInt(routeId);

  if (search) {
    where[Op.or] = [
      { tripId:     { [Op.like]: `%${search}%` } },
      { driverName: { [Op.like]: `%${search}%` } },
    ];
  }

  // Filter by day of week  e.g. ?day=Mon
  // days is stored as JSON array so we use Op.like on its string representation
  if (day) {
    where.days = { [Op.like]: `%${day}%` };
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { count, rows } = await Trip.findAndCountAll({
    where,
    include: includeRelations,
    limit:   parseInt(limit),
    offset,
    order:   [["departureTime", "ASC"]],
  });

  return {
    total:      count,
    page:       parseInt(page),
    totalPages: Math.ceil(count / parseInt(limit)),
    trips:      rows,
  };
};

const getById = async (id) => {
  const trip = await Trip.findByPk(id, { include: includeRelations });
  if (!trip) throw new ApiError(404, "Trip not found");
  return trip;
};

const create = async (data) => {
  const tripId = await generateTripId();

  const trip = await Trip.create({
    tripId,
    routeId:       data.routeId,
    busId:         data.busId,
    driverName:    data.driverName    ?? null,
    direction:     data.direction     ?? "forward",
    departureTime: data.departureTime,
    arrivalTime:   data.arrivalTime,
    days:          data.days          ?? [],
    status:        data.status        ?? "scheduled",
    isActive:      true,
  });

  return getById(trip.id);
};

const update = async (id, data) => {
  const trip = await getById(id);

  await trip.update({
    routeId:       data.routeId       ?? trip.routeId,
    busId:         data.busId         ?? trip.busId,
    driverName:    data.driverName    ?? trip.driverName,
    direction:     data.direction     ?? trip.direction,
    departureTime: data.departureTime ?? trip.departureTime,
    arrivalTime:   data.arrivalTime   ?? trip.arrivalTime,
    days:          data.days          ?? trip.days,
    status:        data.status        ?? trip.status,
  });

  return getById(trip.id);
};

const updateStatus = async (id, status) => {
  const trip = await getById(id);
  await trip.update({ status });
  return getById(trip.id);
};

const remove = async (id) => {
  const trip = await getById(id);
  await trip.destroy();
  return { message: "Trip deleted successfully" };
};

const getStats = async () => {
  const total     = await Trip.count();
  const active    = await Trip.count({ where: { status: "active"    } });
  const delayed   = await Trip.count({ where: { status: "delayed"   } });
  const scheduled = await Trip.count({ where: { status: "scheduled" } });
  const completed = await Trip.count({ where: { status: "completed" } });
  const cancelled = await Trip.count({ where: { status: "cancelled" } });

  return { total, active, delayed, scheduled, completed, cancelled };
};

module.exports = { getAll, getById, create, update, updateStatus, remove, getStats };