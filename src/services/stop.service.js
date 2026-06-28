const { Op } = require("sequelize");
const { Stop } = require("../models");
const ApiError = require("../utils/ApiError");

const getStats = async () => {
  const total    = await Stop.count();
  const active   = await Stop.count({ where: { isActive: true  } });
  const inactive = await Stop.count({ where: { isActive: false } });
  return { total, active, inactive };
};

const getAll = async ({ page = 1, limit = 10, search, id, activeOnly } = {}) => {
  const where = {};

  if (activeOnly === "true")  where.isActive = true;
  if (activeOnly === "false") where.isActive = false;

  // ── ID lookup takes priority over text search ──────────────────────────────
  if (id) {
    where.id = parseInt(id, 10);
  } else if (search) {
    where.stopName = { [Op.like]: `%${search}%` };
  }

  const parsedPage  = Math.max(1, parseInt(page));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));
  const offset      = (parsedPage - 1) * parsedLimit;

  const { count, rows } = await Stop.findAndCountAll({
    where,
    limit:  parsedLimit,
    offset,
    order:  [["createdAt", "DESC"]],   // ← was ASC, now newest first
  });

  return {
    total:      count,
    page:       parsedPage,
    totalPages: Math.ceil(count / parsedLimit),
    stops:      rows,
  };
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

module.exports = { getStats, getAll, getById, create, update, toggleActive };