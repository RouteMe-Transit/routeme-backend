const { Trip } = require("../models");
const ApiError = require("../utils/ApiError");

// ─── ID generator: TR-001, TR-002, ... ────────────────────────────────────────
const generateTripId = async () => {
  const last = await Trip.findOne({
    order: [["id", "DESC"]],
    paranoid: false,
  });
  if (!last) return "TR-001";
  const num = parseInt(last.tripId.replace("TR-", ""), 10) + 1;
  return `TR-${String(num).padStart(3, "0")}`;
};

// ─── Duration helper ──────────────────────────────────────────────────────────
const calcDuration = (departure, arrival) => {
  if (!departure || !arrival) return null;
  const [dh, dm] = departure.split(":").map(Number);
  const [ah, am] = arrival.split(":").map(Number);
  let mins = ah * 60 + am - (dh * 60 + dm);
  if (mins <= 0) mins += 1440; // overnight trip
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// ─── Get all (with filters + pagination) ─────────────────────────────────────
const getAll = async ({ page = 1, limit = 20, status, days, search } = {}) => {
  const { Op } = require("sequelize");
  const where = { isDeleted: false };

  if (status && status !== "All") where.status = status;
  if (days && days !== "All days") where.days = days;
  if (search) {
    where[Op.or] = [
      { tripId:     { [Op.like]: `%${search}%` } },
      { routeName:  { [Op.like]: `%${search}%` } },
      { busId:      { [Op.like]: `%${search}%` } },
      { driverName: { [Op.like]: `%${search}%` } },
    ];
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { count, rows } = await Trip.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / limit),
    trips: rows,
  };
};

// ─── Get by id ────────────────────────────────────────────────────────────────
const getById = async (id) => {
  const trip = await Trip.findByPk(id);
  if (!trip || trip.isDeleted) throw new ApiError(404, "Trip not found");
  return trip;
};

// ─── Get by tripId string (e.g. "TR-001") ────────────────────────────────────
const getByTripId = async (tripId) => {
  const trip = await Trip.findOne({ where: { tripId, isDeleted: false } });
  if (!trip) throw new ApiError(404, "Trip not found");
  return trip;
};

// ─── Create ───────────────────────────────────────────────────────────────────
const create = async (data) => {
  const tripId = await generateTripId();
  const duration = calcDuration(data.departure, data.arrival);

  return Trip.create({
    tripId,
    routeName:  data.routeName,
    direction:  data.direction  || "Forward",
    from:       data.from,
    to:         data.to,
    departure:  data.departure,
    arrival:    data.arrival,
    duration:   duration,
    busId:      data.busId      || null,
    driverName: data.driverName || null,
    days:       data.days       || "Mon-Sat",
    status:     data.status     || "Scheduled",
  });
};

// ─── Update ───────────────────────────────────────────────────────────────────
const update = async (id, data) => {
  const trip = await getByTripId(id);

  const duration =
    data.departure && data.arrival
      ? calcDuration(data.departure, data.arrival)
      : trip.duration;

  await trip.update({
    routeName:  data.routeName  ?? trip.routeName,
    direction:  data.direction  ?? trip.direction,
    from:       data.from       ?? trip.from,
    to:         data.to         ?? trip.to,
    departure:  data.departure  ?? trip.departure,
    arrival:    data.arrival    ?? trip.arrival,
    duration,
    busId:      data.busId      ?? trip.busId,
    driverName: data.driverName ?? trip.driverName,
    days:       data.days       ?? trip.days,
    status:     data.status     ?? trip.status,
  });

  return trip;
};

// ─── Delete (soft) ────────────────────────────────────────────────────────────
const remove = async (id) => {
  const trip = await getByTripId(id);
  await trip.update({ isDeleted: true });
};

// ─── Stats ────────────────────────────────────────────────────────────────────
const getStats = async () => {
  const total     = await Trip.count({ where: { isDeleted: false } });
  const active    = await Trip.count({ where: { isDeleted: false, status: "Active" } });
  const delayed   = await Trip.count({ where: { isDeleted: false, status: "Delayed" } });
  const scheduled = await Trip.count({ where: { isDeleted: false, status: "Scheduled" } });
  return { total, active, delayed, scheduled };
};

module.exports = { getAll, getById, getByTripId, create, update, remove, getStats };