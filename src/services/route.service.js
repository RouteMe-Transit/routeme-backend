const { Route } = require("../models");
const ApiError = require("../utils/ApiError");

const generateRouteId = async () => {
  const last = await Route.findOne({ order: [["id", "DESC"]] });
  const n = last ? parseInt(last.routeId.replace("RT", ""), 10) + 1 : 1;
  return `RT${String(n).padStart(4, "0")}`;
};

const getAll = async ({ page = 1, limit = 20, status, search } = {}) => {
  const { Op } = require("sequelize");
  const where = {};
  if (status && status !== "All Status") where.status = status;
  if (search) {
    where[Op.or] = [
      { routeId: { [Op.like]: `%${search}%` } },
      { name: { [Op.like]: `%${search}%` } },
      { from: { [Op.like]: `%${search}%` } },
      { to: { [Op.like]: `%${search}%` } },
    ];
  }
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { count, rows } = await Route.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [["createdAt", "DESC"]],
  });
  return { total: count, page: parseInt(page), totalPages: Math.ceil(count / limit), routes: rows };
};

const getById = async (id) => {
  const route = await Route.findByPk(id);
  if (!route || route.isDeleted) throw new ApiError(404, "Route not found");
  return route;
};

const create = async (data) => {
  const routeId = await generateRouteId();
  return Route.create({ ...data, routeId, stops: data.stopList?.length || 0 });
};

const update = async (id, data) => {
  const route = await getById(id);
  await route.update({ ...data, stops: data.stopList?.length || route.stopList?.length });
  return route;
};

const remove = async (id) => {
  const route = await getById(id);
  await route.update({ isDeleted: true });
};

module.exports = { getAll, getById, create, update, remove };