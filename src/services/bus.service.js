const { Op } = require("sequelize");
const { BusDetails, User, Route } = require("../models");
const userService = require("./user.service");
const ApiError = require("../utils/ApiError");

const VALID_STATUSES = ["Active", "Maintenance", "Breakdown"];

// ─── getAll ───────────────────────────────────────────────────────────────────
const getAll = async ({ page = 1, limit = 20, search, status, userId } = {}) => {
  const where = {};

  // Filter by a specific user (bus account) if provided
  if (userId) {
    where.userId = parseInt(userId, 10);
  }

  // Search by plate or owner name
  if (search) {
    where[Op.or] = [
      { registrationNumber: { [Op.like]: `%${search}%` } },
      { ownerName:          { [Op.like]: `%${search}%` } },
    ];
  }

  // Filter on the dedicated status ENUM — all three values are now distinct
  if (status && VALID_STATUSES.includes(status)) {
    where.status = status;
  }

  const parsedPage  = Math.max(1, parseInt(page));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));
  const offset      = (parsedPage - 1) * parsedLimit;

  const { count, rows } = await BusDetails.findAndCountAll({
    where,
    include: [
      { model: User,  as: "user",  attributes: ["id", "email"] },
      { model: Route, as: "route", attributes: ["id", "routeName", "from", "to"] },
    ],
    limit:  parsedLimit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    total:      count,
    page:       parsedPage,
    totalPages: Math.ceil(count / parsedLimit),
    buses:      rows,
  };
};

// ─── getById ──────────────────────────────────────────────────────────────────
const getById = async (id) => {
  const bus = await BusDetails.findByPk(id, {
    include: [
      { model: User,  as: "user",  attributes: ["id", "email"] },
      { model: Route, as: "route", attributes: ["id", "routeName", "from", "to"] },
    ],
  });
  if (!bus) throw new ApiError(404, "Bus not found");
  return bus;
};

// ─── create ───────────────────────────────────────────────────────────────────
const create = async (data) => {
  const owner = data.owner;

  // Create the linked bus user account
  const busUser = await userService.createUser(
    {
      firstName: owner.name.split(" ")[0],
      lastName:  owner.name.split(" ").slice(1).join(" ") || "Owner",
      email:     owner.email,
      phone:     owner.phone,
      password:  data.password,
      role:      "bus",
    },
    { createdByAdmin: true }
  );

  // Derive isActive from status (Active = true, anything else = false)
  const status   = VALID_STATUSES.includes(data.status) ? data.status : "Active";
  const isActive = status === "Active";

  const bus = await BusDetails.create({
    userId:             busUser.id,
    routeId:            data.routeId            ?? null,
    registrationNumber: data.registrationNumber,
    busType:            data.busType            ?? "Regular",
    totalSeats:         data.totalSeats         ?? 45,
    latitude:           data.latitude           ?? null,
    longitude:          data.longitude          ?? null,
    ownerName:          owner.name,
    ownerNic:           owner.nic,
    ownerEmail:         owner.email,
    ownerPhone:         owner.phone,
    drivers:            data.drivers            ?? [],
    recordedAt:         data.recordedAt         ?? null,
    status,
    isActive,
  });

  return { ...bus.toJSON(), password: data.password };
};

// ─── update ───────────────────────────────────────────────────────────────────
const update = async (id, data) => {
  const bus = await getById(id);

  // Keep status and isActive in sync whenever status is provided
  const statusUpdate = {};
  if (data.status !== undefined && VALID_STATUSES.includes(data.status)) {
    statusUpdate.status   = data.status;
    statusUpdate.isActive = data.status === "Active";
  }

  await bus.update({
    routeId:            data.routeId,
    registrationNumber: data.registrationNumber,
    busType:            data.busType,
    totalSeats:         data.totalSeats,
    latitude:           data.latitude,
    longitude:          data.longitude,
    ownerName:          data.owner?.name,
    ownerNic:           data.owner?.nic,
    ownerEmail:         data.owner?.email,
    ownerPhone:         data.owner?.phone,
    drivers:            data.drivers,
    recordedAt:         data.recordedAt,
    ...statusUpdate,
  });

  return bus;
};

// ─── toggleActive ─────────────────────────────────────────────────────────────
// Cycles: Active → Maintenance, Maintenance/Breakdown → Active
// isActive is kept in sync: Active = true, everything else = false
const toggleActive = async (id) => {
  const bus      = await getById(id);
  const next     = bus.status === "Active" ? "Maintenance" : "Active";
  const isActive = next === "Active";

  await User.update({ isActive }, { where: { id: bus.userId } });
  await bus.update({ status: next, isActive });
  return bus;
};

// ─── getStats ─────────────────────────────────────────────────────────────────
const getStats = async () => {
  const total       = await BusDetails.count();
  const active      = await BusDetails.count({ where: { status: "Active"      } });
  const maintenance = await BusDetails.count({ where: { status: "Maintenance" } });
  const breakdown   = await BusDetails.count({ where: { status: "Breakdown"   } });

  return {
    total,
    active,
    inactive:    maintenance + breakdown,
    maintenance,
    breakdown,
  };
};

module.exports = { getAll, getById, create, update, toggleActive, getStats };