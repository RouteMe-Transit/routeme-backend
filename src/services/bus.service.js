const { BusDetails, User, Route } = require("../models");
const userService = require("./user.service");
const ApiError = require("../utils/ApiError");

const getAll = async ({ page = 1, limit = 20, search } = {}) => {
  const { Op } = require("sequelize");
  const where = {};
  if (search) {
    where[Op.or] = [
      { registrationNumber: { [Op.like]: `%${search}%` } },
      { ownerName:          { [Op.like]: `%${search}%` } },
    ];
  }
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { count, rows } = await BusDetails.findAndCountAll({
    where,
    include: [
      { model: User,  as: "user",  attributes: ["id", "email"] },
      { model: Route, as: "route", attributes: ["id", "routeName", "from", "to"] },
    ],
    limit: parseInt(limit),
    offset,
    order: [["createdAt", "DESC"]],
  });
  return {
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / limit),
    buses: rows,
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

  const bus = await BusDetails.create({
    userId:             busUser.id,
    routeId:            data.routeId ?? null,
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
    isActive:           true,
  });

  return { ...bus.toJSON(), password: data.password };
};

const update = async (id, data) => {
  const bus = await getById(id);

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
  });

  return bus;
};

const toggleActive = async (id) => {
  const bus = await getById(id);
  const nextActive = !bus.isActive;
  await User.update({ isActive: nextActive }, { where: { id: bus.userId } });
  await bus.update({ isActive: nextActive });
  return bus;
};

const getStats = async () => {
  const total       = await BusDetails.count();
  const active      = await BusDetails.count({ where: { isActive: true  } });
  const inactive    = await BusDetails.count({ where: { isActive: false } });
  return { total, active, inactive };
};

module.exports = { getAll, getById, create, update, toggleActive, getStats };