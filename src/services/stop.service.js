const { Stop } = require("../models");
const ApiError = require("../utils/ApiError");

const generateStopCode = async () => {
  const last = await Stop.findOne({ order: [["id", "DESC"]] });
  const n = last ? parseInt(last.stopCode.replace("S", ""), 10) + 1 : 1;
  return `S${String(n).padStart(2, "0")}`;
};

const getAll = async ({ page = 1, limit = 50, search, activeOnly } = {}) => {
  const { Op } = require("sequelize");
  const where = {};
  if (activeOnly === "true") where.isActive = true;
  if (search) where.name = { [Op.like]: `%${search}%` };
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { count, rows } = await Stop.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [["createdAt", "ASC"]],
  });
  return { total: count, page: parseInt(page), totalPages: Math.ceil(count / limit), stops: rows };
};

const getById = async (id) => {
  const stop = await Stop.findByPk(id);
  if (!stop || stop.isDeleted) throw new ApiError(404, "Stop not found");
  return stop;
};

const create = async (data) => {
  const stopCode = await generateStopCode();
  return Stop.create({ ...data, stopCode });
};

const update = async (id, data) => {
  const stop = await getById(id);
  await stop.update(data);
  return stop;
};

const toggleActive = async (id) => {
  const stop = await getById(id);
  await stop.update({ isActive: !stop.isActive });
  return stop;
};

const remove = async (id) => {
  const stop = await getById(id);
  await stop.update({ isDeleted: true });
};

module.exports = { getAll, getById, create, update, toggleActive, remove };