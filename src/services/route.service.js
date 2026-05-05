const { Route, RouteStop, Stop } = require("../models");
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

  // load associated stops from route_stops table
  const routeStops = await RouteStop.findAll({
    where: { routeId: route.id },
    include: [{ model: Stop, as: "stop", attributes: ["id", "stopName", "latitude", "longitude"] }],
    order: [["stopSequence", "ASC"]],
  });

  const result = route.toJSON();
  result.routeStops = routeStops.map((rs) => ({
    id: rs.id,
    stopId: rs.stopId,
    stopSequence: rs.stopSequence,
    time: rs.time,
    stop: rs.stop || null,
  }));

  // stopList is legacy JSON kept on the Route record; routeStops is the canonical table.
  // Remove `stopList` from the GET-by-id response to avoid duplication.
  if (Object.prototype.hasOwnProperty.call(result, "stopList")) delete result.stopList;

  return result;
};

const create = async (data) => {
  const route = await Route.create({
    routeName: data.routeName,
    from:      data.from,
    to:        data.to,
    noOfBuses: data.noOfBuses ?? 0,
    avgTime:   data.avgTime   ?? null,
    stopList:  data.stopList  ?? [],
    isActive:  data.isActive  ?? true,
  });

  if (Array.isArray(data.stopList) && data.stopList.length) {
    for (const item of data.stopList) {
      const stop = await Stop.findByPk(item.stopId);
      if (!stop) throw new ApiError(404, `Stop not found (id=${item.stopId})`);
      await RouteStop.create({
        routeId: route.id,
        stopId: item.stopId,
        stopSequence: item.stopSequence ?? 1,
        time: item.time ?? null,
      });
    }
  }

  return getById(route.id);
};

const update = async (id, data) => {
  const route = await Route.findByPk(id);
  if (!route) throw new ApiError(404, "Route not found");

  await route.update({
    routeName: data.routeName ?? route.routeName,
    from:      data.from      ?? route.from,
    to:        data.to        ?? route.to,
    noOfBuses: data.noOfBuses ?? route.noOfBuses,
    avgTime:   data.avgTime   ?? route.avgTime,
    stopList:  data.stopList  ?? route.stopList,
  });

  // If stopList provided, replace route stops
  if (Array.isArray(data.stopList)) {
    await RouteStop.destroy({ where: { routeId: route.id } });
    for (const item of data.stopList) {
      const stop = await Stop.findByPk(item.stopId);
      if (!stop) throw new ApiError(404, `Stop not found (id=${item.stopId})`);
      await RouteStop.create({
        routeId: route.id,
        stopId: item.stopId,
        stopSequence: item.stopSequence ?? 1,
        time: item.time ?? null,
      });
    }
  }

  return getById(route.id);
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