const { Route } = require("../models");
const ApiError = require("../utils/ApiError");

const getAll = async ({ page = 1, limit = 20, search } = {}) => {
  const { Op } = require("sequelize");
  const where = {};
  if (search) {
    where[Op.or] = [
      { routeName: { [Op.like]: `%${search}%` } },
      { from:      { [Op.like]: `%${search}%` } },
      { to:        { [Op.like]: `%${search}%` } },
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
  if (!route) throw new ApiError(404, "Route not found");
  return route;
};

const create = async (data) => {
  return Route.create({
    routeName: data.routeName,
    from:      data.from,
    to:        data.to,
    noOfBuses: data.noOfBuses ?? 0,
    avgTime:   data.avgTime   ?? null,
    stopList:  data.stopList  ?? [],
    isActive:  data.isActive  ?? true,
  });
};

const update = async (id, data) => {
  const route = await getById(id);
  await route.update({
    routeName: data.routeName ?? route.routeName,
    from:      data.from      ?? route.from,
    to:        data.to        ?? route.to,
    noOfBuses: data.noOfBuses ?? route.noOfBuses,
    avgTime:   data.avgTime   ?? route.avgTime,
    stopList:  data.stopList  ?? route.stopList,
  });
  return route;
};

const suspend = async (id) => {
  const route = await getById(id);
  await route.update({ isActive: !route.isActive });
  return route;
};

const remove = async (id) => {
  const route = await getById(id);
  await route.destroy();
};

module.exports = { getAll, getById, create, update, remove, suspend };