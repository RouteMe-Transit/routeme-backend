const { Route, RouteStop, Stop } = require("../models");
const ApiError = require("../utils/ApiError");

// ─── getAll ───────────────────────────────────────────────────────────────────
const getAll = async ({ page = 1, limit = 20, search, status, id } = {}) => {
  const { Op } = require("sequelize");
  const where = {};

  // ── ID lookup (e.g. ?id=2 from "RT0002") ─────────────────────────────────
  if (id) {
    where.id = parseInt(id, 10);
  } else if (search) {
    where[Op.or] = [
      { routeName: { [Op.like]: `%${search}%` } },
      { from:      { [Op.like]: `%${search}%` } },
      { to:        { [Op.like]: `%${search}%` } },
    ];
  }

  if (status === "active")   where.isActive = true;
  if (status === "inactive") where.isActive = false;

  // rest unchanged...

  // ── ID lookup (e.g. ?id=2 from "RT0002") ─────────────────────────────────
  if (id) {
    where.id = parseInt(id, 10);
  } else if (search) {
    where[Op.or] = [
      { routeName: { [Op.like]: `%${search}%` } },
      { from:      { [Op.like]: `%${search}%` } },
      { to:        { [Op.like]: `%${search}%` } },
    ];
  }

  if (status === "active")   where.isActive = true;
  if (status === "inactive") where.isActive = false;

  if (search) {
    where[Op.or] = [
      { routeName: { [Op.like]: `%${search}%` } },
      { from:      { [Op.like]: `%${search}%` } },
      { to:        { [Op.like]: `%${search}%` } },
    ];
  }

  if (status === "active")   where.isActive = true;
  if (status === "inactive") where.isActive = false;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { count, rows } = await Route.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [["createdAt", "DESC"]],
  });

  const routesWithStops = await Promise.all(
    rows.map(async (route) => {
      const routeStops = await RouteStop.findAll({
        where: { routeId: route.id },
        include: [{ model: Stop, as: "stop", attributes: ["id", "stopName"] }],
        order: [["stopSequence", "ASC"]],
      });
      const stopList = routeStops.map((rs, idx) => ({
        id:            String(idx + 1).padStart(2, "0"),
        stopId:        rs.stopId,
        name:          rs.stop ? rs.stop.stopName : "",
        timeFromStart: rs.time ?? "00.00",
      }));
      return { ...route.toJSON(), stopList };
    })
  );

  return {
    total:      count,
    page:       parseInt(page),
    totalPages: Math.ceil(count / limit),
    routes:     routesWithStops,
  };
};

// ─── getById ──────────────────────────────────────────────────────────────────
const getById = async (id) => {
  const route = await Route.findByPk(id);
  if (!route) throw new ApiError(404, "Route not found");

  const routeStops = await RouteStop.findAll({
    where:   { routeId: route.id },
    include: [{ model: Stop, as: "stop", attributes: ["id", "stopName", "latitude", "longitude"] }],
    order:   [["stopSequence", "ASC"]],
  });

  const result = route.toJSON();

  result.stopList = routeStops.map((rs, idx) => ({
    id:            String(idx + 1).padStart(2, "0"),
    stopId:        rs.stopId,
    name:          rs.stop ? rs.stop.stopName : "",
    timeFromStart: rs.time ?? "00.00",
  }));

  result.routeStops = routeStops.map((rs) => ({
    id:           rs.id,
    stopId:       rs.stopId,
    stopSequence: rs.stopSequence,
    time:         rs.time,
    stop:         rs.stop ?? null,
  }));

  return result;
};

// ─── create ───────────────────────────────────────────────────────────────────
const create = async (data) => {
  const route = await Route.create({
    routeName: data.routeName,
    from:      data.from,
    to:        data.to,
    noOfBuses: data.noOfBuses ?? 0,
    avgTime:   data.avgTime   ?? null,
    isActive:  data.isActive  ?? true,
  });

  if (Array.isArray(data.stopList) && data.stopList.length) {
    for (const item of data.stopList) {
      const stop = await Stop.findByPk(item.stopId);
      if (!stop) throw new ApiError(404, `Stop not found (id=${item.stopId})`);
      await RouteStop.create({
        routeId:      route.id,
        stopId:       item.stopId,
        stopSequence: item.stopSequence ?? 1,
        time:         item.time ?? null,
      });
    }
  }

  return getById(route.id);
};

// ─── update ───────────────────────────────────────────────────────────────────
const update = async (id, data) => {
  const route = await Route.findByPk(id);
  if (!route) throw new ApiError(404, "Route not found");

  await route.update({
    routeName: data.routeName ?? route.routeName,
    from:      data.from      ?? route.from,
    to:        data.to        ?? route.to,
    noOfBuses: data.noOfBuses ?? route.noOfBuses,
    avgTime:   data.avgTime   ?? route.avgTime,
    isActive:  data.isActive  !== undefined ? data.isActive : route.isActive,
  });

  if (Array.isArray(data.stopList)) {
    await RouteStop.destroy({ where: { routeId: route.id } });
    for (const item of data.stopList) {
      const stop = await Stop.findByPk(item.stopId);
      if (!stop) throw new ApiError(404, `Stop not found (id=${item.stopId})`);
      await RouteStop.create({
        routeId:      route.id,
        stopId:       item.stopId,
        stopSequence: item.stopSequence ?? 1,
        time:         item.time ?? null,
      });
    }
  }

  return getById(route.id);
};

// ─── suspend (toggle isActive) ────────────────────────────────────────────────
const suspend = async (id) => {
  const route = await Route.findByPk(id);
  if (!route) throw new ApiError(404, "Route not found");
  await route.update({ isActive: !route.isActive });
  return getById(id);
};

// ─── remove ───────────────────────────────────────────────────────────────────
const remove = async (id) => {
  const route = await Route.findByPk(id);
  if (!route) throw new ApiError(404, "Route not found");
  await route.destroy();
};

module.exports = { getAll, getById, create, update, remove, suspend };