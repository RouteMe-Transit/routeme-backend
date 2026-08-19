const { Op } = require("sequelize");
const sequelize = require("../config/database");
const { Trip, Route, BusDetails } = require("../models");
const ApiError = require("../utils/ApiError");

// ── Duration computed on every SELECT via SQL ─────────────────────────────────
const durationSQL = `CONCAT(
  FLOOR(MOD(TIME_TO_SEC(arrivalTime) - TIME_TO_SEC(departureTime) + 86400, 86400) / 3600),
  'h ',
  LPAD(
    FLOOR(MOD(MOD(TIME_TO_SEC(arrivalTime) - TIME_TO_SEC(departureTime) + 86400, 86400), 3600) / 60),
    2, '0'
  ),
  'm'
)`;

const includeRelations = [
  { model: Route,      as: "route", attributes: ["id", "routeName", "from", "to"] },
  { model: BusDetails, as: "bus",   attributes: ["id", "registrationNumber", "busType"] },
];

const withDuration = {
  attributes: {
    include: [[sequelize.literal(durationSQL), "duration"]],
  },
};

// ── Service methods ───────────────────────────────────────────────────────────

const getAll = async ({ page = 1, limit = 20, search, id, status, direction, routeId, day } = {}) => {
  const where = {};

  if (status)    where.status    = status;
  if (direction) where.direction = direction;
  if (routeId)   where.routeId   = parseInt(routeId);
  if (day)       where.days      = { [Op.like]: `%${day}%` };

  // ID search: frontend sends ?id=1 when user types TR0001
  if (id) {
    where.id = parseInt(id);
  }

  // Text search: use $association.column$ notation with subQuery:false
  if (search) {
    where[Op.or] = [
      { "$route.routeName$":           { [Op.like]: `%${search}%` } },
      { "$route.from$":                { [Op.like]: `%${search}%` } },
      { "$route.to$":                  { [Op.like]: `%${search}%` } },
      { "$bus.registrationNumber$":    { [Op.like]: `%${search}%` } },
    ];
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { count, rows } = await Trip.findAndCountAll({
    where,
    ...withDuration,
    include:  includeRelations,   // always plain include — no required:true
    limit:    parseInt(limit),
    offset,
    order:    [["id", "DESC"]],   // newest trips first (TR000N → TR0001)
    subQuery: false,              // required for $association.col$ filtering
  });

  return {
    total:      count,
    page:       parseInt(page),
    totalPages: Math.ceil(count / parseInt(limit)),
    trips:      rows,
  };
};

const getById = async (id) => {
  const trip = await Trip.findByPk(id, {
    ...withDuration,
    include: includeRelations,
  });
  if (!trip) throw new ApiError(404, "Trip not found");
  return trip;
};

const create = async (data) => {
  const trip = await Trip.create({
    routeId:       data.routeId,
    busId:         data.busId,
    direction:     data.direction     ?? "forward",
    departureTime: data.departureTime,
    arrivalTime:   data.arrivalTime,
    days:          data.days          ?? [],
    status:        data.status        ?? "active",
    isActive:      true,
  });

  return getById(trip.id);
};

const update = async (id, data) => {
  const trip = await Trip.findByPk(id);
  if (!trip) throw new ApiError(404, "Trip not found");

  await trip.update({
    routeId:       data.routeId       ?? trip.routeId,
    busId:         data.busId         ?? trip.busId,
    direction:     data.direction     ?? trip.direction,
    departureTime: data.departureTime ?? trip.departureTime,
    arrivalTime:   data.arrivalTime   ?? trip.arrivalTime,
    days:          data.days          ?? trip.days,
    status:        data.status        ?? trip.status,
    isActive:      data.isActive      ?? trip.isActive,
  });

  return getById(trip.id);
};

const toggleActive = async (id) => {
  const trip = await Trip.findByPk(id);
  if (!trip) throw new ApiError(404, "Trip not found");
  await trip.update({ isActive: !trip.isActive });
  return getById(trip.id);
};

const remove = async (id) => {
  const trip = await Trip.findByPk(id);
  if (!trip) throw new ApiError(404, "Trip not found");
  await trip.destroy();
  return { message: "Trip deleted successfully" };
};

// ── Stats ──────────────────────────────────────────────────────────────────
// Simple counts only: total trips and cancelled trips.
const getStats = async () => {
  const total     = await Trip.count();
  const cancelled = await Trip.count({ where: { status: "cancelled" } });

  return { total, cancelled };
};

module.exports = { getAll, getById, create, update, toggleActive, remove, getStats };