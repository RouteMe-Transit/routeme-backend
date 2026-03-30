const { Route, Bus } = require("../models");
const ApiError = require("../utils/ApiError");

const getAllRoutes = async ({ page = 1, limit = 10, routeType } = {}) => {
  const offset = (page - 1) * limit;
  const where = {};
  if (routeType) where.routeType = routeType;

  const { count, rows } = await Route.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
  });

  return {
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / limit),
    routes: rows,
  };
};

const getRouteById = async (id) => {
  const route = await Route.findByPk(id, {
    include: [
      {
        model: Bus,
        as: "buses",
        attributes: ["id", "busNumber", "licensePlate", "status"],
      },
    ],
  });

  if (!route) throw new ApiError(404, "Route not found");
  return route;
};

const createRoute = async (data) => {
  const existing = await Route.findOne({
    where: { routeNumber: data.routeNumber },
  });

  if (existing) throw new ApiError(409, "Route number already exists");
  return Route.create(data);
};

const updateRoute = async (id, data) => {
  const route = await getRouteById(id);

  if (data.routeNumber && data.routeNumber !== route.routeNumber) {
    const existing = await Route.findOne({
      where: { routeNumber: data.routeNumber },
    });

    if (existing) throw new ApiError(409, "Route number already exists");
  }

  await route.update(data);
  return route;
};

const deleteRoute = async (id) => {
  const route = await getRouteById(id);

  const assignedBuses = await Bus.count({
    where: { assignRoute: id },
  });

  if (assignedBuses > 0) {
    throw new ApiError(
      409,
      "Cannot delete route with assigned buses. Reassign buses first."
    );
  }

  await route.update({ isActive: false });
};

module.exports = {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
};