const { Stop } = require("../models");
const ApiError = require("../utils/ApiError");

const getAll = async ({ page = 1, limit = 50, search, id, activeOnly } = {}) => {
  const { Op } = require("sequelize");
  const where = {};

  // activeOnly filter (used by StopPickerModal in routes page)
  if (activeOnly === "true") where.isActive = true;

  // ID search takes priority over text search
  if (id) {
    const parsed = parseInt(id, 10);
    if (!isNaN(parsed)) where.id = parsed;
  } else if (search) {
    where.stopName = { [Op.like]: `%${search}%` };
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { count, rows } = await Stop.findAndCountAll({
    where,
    limit:  parseInt(limit),
    offset,
    order:  [["createdAt", "DESC"]],
  });

  return {
    total:      count,
    page:       parseInt(page),
    totalPages: Math.ceil(count / limit),
    stops:      rows,
  };
};

const getStats = async () => {
  const total    = await Stop.count();
  const active   = await Stop.count({ where: { isActive: true  } });
  const inactive = await Stop.count({ where: { isActive: false } });
  return { total, active, inactive };
};

const getById = async (id) => {
  const stop = await Stop.findByPk(id);
  if (!stop) throw new ApiError(404, "Stop not found");
  return stop;
};

const create = async (data) => {
  return Stop.create({
    stopName:  data.stopName,
    latitude:  data.latitude,
    longitude: data.longitude,
    isActive:  data.isActive ?? true,
  });
};

const update = async (id, data) => {
  const stop = await getById(id);
  await stop.update({
    stopName:  data.stopName  ?? stop.stopName,
    latitude:  data.latitude  ?? stop.latitude,
    longitude: data.longitude ?? stop.longitude,
  });
  return stop;
};

const toggleActive = async (id) => {
  const stop = await getById(id);
  await stop.update({ isActive: !stop.isActive });
  return stop;
};

module.exports = { getAll, getStats, getById, create, update, toggleActive };