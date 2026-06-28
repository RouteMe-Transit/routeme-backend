const { BusDetails, User, Route } = require("../models");
const userService = require("./user.service");
const ApiError = require("../utils/ApiError");

const getAll = async ({ page = 1, limit = 20, search, userId, status } = {}) => {
  const { Op } = require("sequelize");

  const where = {};

  // Status filter — now uses the real status column
  if (status) where.status = status;

  // Text search on plate or owner name — only when no ID search
  if (!userId && search) {
    where[Op.or] = [
      { registrationNumber: { [Op.like]: `%${search}%` } },
      { ownerName:          { [Op.like]: `%${search}%` } },
    ];
  }

  // userId filter — for BUS0005-style ID search (matches users table PK)
  const userWhere = {};
  if (userId) {
    const parsed = parseInt(userId, 10);
    if (!isNaN(parsed)) userWhere.id = parsed;
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { count, rows } = await BusDetails.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email"],
        where:    Object.keys(userWhere).length ? userWhere : undefined,
        required: Object.keys(userWhere).length > 0,
      },
      {
        model: Route,
        as: "route",
        attributes: ["id", "routeName", "from", "to"],
      },
    ],
    limit:  parseInt(limit),
    offset,
    order:  [["createdAt", "DESC"]],
  });

  return {
    total:      count,
    page:       parseInt(page),
    totalPages: Math.ceil(count / limit),
    buses:      rows,
  };
};

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

const create = async (data) => {
  const owner = data.owner;

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

  // Derive isActive from status
  const status   = data.status ?? "Active";
  const isActive = status === "Active";

  const bus = await BusDetails.create({
    userId:             busUser.id,
    routeId:            data.routeId    ?? null,
    registrationNumber: data.registrationNumber,
    busType:            data.busType    ?? "Regular",
    totalSeats:         data.totalSeats ?? 45,
    latitude:           data.latitude   ?? null,
    longitude:          data.longitude  ?? null,
    ownerName:          owner.name,
    ownerNic:           owner.nic,
    ownerEmail:         owner.email,
    ownerPhone:         owner.phone,
    drivers:            data.drivers    ?? [],
    recordedAt:         data.recordedAt ?? null,
    status,
    isActive,
  });

  return { ...bus.toJSON(), password: data.password };
};

const update = async (id, data) => {
  const bus = await getById(id);

  // Keep isActive in sync with status
  const status   = data.status ?? bus.status;
  const isActive = status === "Active";

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
    status,
    isActive,
  });

  // Also sync the linked user's isActive
  if (bus.userId) {
    await User.update({ isActive }, { where: { id: bus.userId } });
  }

  return bus;
};

const toggleActive = async (id) => {
  const bus      = await getById(id);
  const isActive = !bus.isActive;
  // Toggle: Active ↔ Maintenance (Breakdown stays as-is until manually edited)
  const status   = isActive ? "Active" : "Maintenance";

  await User.update({ isActive }, { where: { id: bus.userId } });
  await bus.update({ isActive, status });
  return bus;
};

const getStats = async () => {
  const total       = await BusDetails.count();
  const active      = await BusDetails.count({ where: { status: "Active"      } });
  const maintenance = await BusDetails.count({ where: { status: "Maintenance" } });
  const breakdown   = await BusDetails.count({ where: { status: "Breakdown"   } });

  return { total, active, maintenance, breakdown };
};

module.exports = { getAll, getById, create, update, toggleActive, getStats };