const { BusDetails, User } = require("../models");
const userService = require("./user.service");
const ApiError = require("../utils/ApiError");

const generateBusId = async () => {
  const last = await BusDetails.findOne({ order: [["id", "DESC"]] });
  const n = last ? parseInt(last.busId.replace("BUS", ""), 10) + 1 : 1;
  return `BUS${String(n).padStart(4, "0")}`;
};

const getAll = async ({ page = 1, limit = 20, status, search } = {}) => {
  const { Op } = require("sequelize");
  const where = {};
  if (status && status !== "All Status") where.status = status;
  if (search) {
    where[Op.or] = [
      { busId: { [Op.like]: `%${search}%` } },
      { plate: { [Op.like]: `%${search}%` } },
      { ownerName: { [Op.like]: `%${search}%` } },
    ];
  }
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { count, rows } = await BusDetails.findAndCountAll({
    where,
    include: [{ model: User, as: "user", attributes: ["id", "email"] }],
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
    include: [{ model: User, as: "user", attributes: ["id", "email"] }],
  });
  if (!bus) throw new ApiError(404, "Bus not found");
  return bus;
};

const create = async (data) => {
  const owner = data.owner;
  const busUser = await userService.createUser(
    {
      firstName: owner.name.split(" ")[0],
      lastName: owner.name.split(" ").slice(1).join(" ") || "Owner",
      email: owner.email,
      phone: owner.phone,
      password: data.password,
      role: "bus",
      assignedRoute: data.route,
    },
    { createdByAdmin: true }
  );

  const busId = await generateBusId();
  const bus = await BusDetails.create({
    userId: busUser.id,
    busId,
    plate: data.plate,
    type: data.type,
    assignedRoute: data.route,
    seats: data.seats,
    lastService: data.lastService,
    status: data.status || "Active",
    ownerName: data.owner.name,
    ownerNic: data.owner.nic,
    ownerEmail: data.owner.email,
    ownerPhone: data.owner.phone,
    drivers: data.drivers,
  });

  return { ...bus.toJSON(), password: data.password };
};

const update = async (id, data) => {
  const bus = await getById(id);
  if (data.route) {
    await User.update({ assignedRoute: data.route }, { where: { id: bus.userId } });
  }
  await bus.update({
    plate: data.plate,
    type: data.type,
    assignedRoute: data.route,
    seats: data.seats,
    lastService: data.lastService,
    status: data.status,
    ownerName: data.owner?.name,
    ownerNic: data.owner?.nic,
    ownerEmail: data.owner?.email,
    ownerPhone: data.owner?.phone,
    drivers: data.drivers,
  });
  return bus;
};

const remove = async (id) => {
  const bus = await getById(id);
  await User.update({ isActive: false }, { where: { id: bus.userId } });
  await bus.destroy();
};

const getStats = async () => {
  const total = await BusDetails.count();
  const maintenance = await BusDetails.count({ where: { status: "Maintenance" } });
  const breakdown = await BusDetails.count({ where: { status: "Breakdown" } });
  const operational = await BusDetails.count({ where: { status: "Active" } });
  return { total, maintenance, breakdown, operational };
};

// ✅ THIS IS WHAT WAS MISSING
module.exports = { getAll, getById, create, update, remove, getStats };