const { Op } = require("sequelize");
const { BusDetails, BusLiveLocation, Route } = require("../models");
const ApiError = require("../utils/ApiError");
const { emitLiveTrackingUpdate } = require("./websocket.service");

const STALE_TIMEOUT_SECONDS = parseInt(process.env.BUS_LIVE_STALE_TIMEOUT_SECONDS || "35", 10);
const DEFAULT_RADIUS_KM = parseFloat(process.env.BUS_LIVE_DEFAULT_RADIUS_KM || "5");
const DEFAULT_LIMIT = parseInt(process.env.BUS_LIVE_DEFAULT_LIMIT || "25", 10);

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const resolveRoute = async ({ routeId, routeName } = {}) => {
  if (routeId) return Route.findByPk(routeId);
  if (!routeName) return null;
  return Route.findOne({ where: { routeName: { [Op.eq]: String(routeName).trim() } } });
};

const deriveStatus = (bus, now = Date.now()) => {
  if (!bus.isActive || !bus.gpsEnabled) return "inactive";
  if (!bus.lastSeenAt) return "inactive";

  const lastSeenTime = new Date(bus.lastSeenAt).getTime();
  if (Number.isNaN(lastSeenTime)) return "inactive";

  return now - lastSeenTime > STALE_TIMEOUT_SECONDS * 1000 ? "stale" : "active";
};

const refreshLiveStatuses = async () => {
  const staleCutoff = new Date(Date.now() - STALE_TIMEOUT_SECONDS * 1000);

  await BusDetails.update(
    { liveStatus: "inactive" },
    {
      where: {
        gpsEnabled: false,
        liveStatus: { [Op.ne]: "inactive" },
      },
    }
  );

  await BusDetails.update(
    { liveStatus: "stale" },
    {
      where: {
        gpsEnabled: true,
        lastSeenAt: { [Op.lt]: staleCutoff },
        liveStatus: { [Op.ne]: "stale" },
      },
    }
  );

  await BusDetails.update(
    { liveStatus: "active" },
    {
      where: {
        gpsEnabled: true,
        lastSeenAt: { [Op.gte]: staleCutoff },
        liveStatus: { [Op.ne]: "active" },
      },
    }
  );
};

const getBusForUser = async (userId) => {
  const bus = await BusDetails.findOne({
    where: { userId },
    include: [{ model: Route, as: "route", attributes: ["id", "routeName", "from", "to"] }],
  });

  if (!bus) throw new ApiError(404, "Bus not found for this user");
  if (!bus.isActive) throw new ApiError(403, "Bus account is suspended");

  return bus;
};

const mapBusLiveResponse = (bus, passengerLat = null, passengerLng = null) => {
  const busLat = toNumber(bus.latitude);
  const busLng = toNumber(bus.longitude);

  const hasPassengerCoords = Number.isFinite(passengerLat) && Number.isFinite(passengerLng);
  const hasBusCoords = Number.isFinite(busLat) && Number.isFinite(busLng);

  const distanceFromPassenger = hasPassengerCoords && hasBusCoords
    ? haversineDistanceKm(passengerLat, passengerLng, busLat, busLng)
    : null;

  const currentStatus = deriveStatus(bus);

  return {
    busId: bus.id,
    busUserId: bus.userId,
    registrationNumber: bus.registrationNumber,
    busType: bus.busType,
    totalSeats: bus.totalSeats,
    routeId: bus.routeId,
    routeName: bus.route?.routeName ?? null,
    from: bus.route?.from ?? null,
    to: bus.route?.to ?? null,
    latitude: hasBusCoords ? busLat : null,
    longitude: hasBusCoords ? busLng : null,
    status: currentStatus,
    lastUpdated: bus.lastSeenAt || bus.recordedAt || null,
    gpsEnabled: !!bus.gpsEnabled,
    distanceFromPassenger,
    staleAfterSeconds: STALE_TIMEOUT_SECONDS,
  };
};

const uploadLocation = async (userId, payload = {}) => {
  const bus = await getBusForUser(userId);
  const now = toDate(payload.timestamp);

  const gpsOn = payload.gpsOn !== false;
  const latitude = toNumber(payload.latitude);
  const longitude = toNumber(payload.longitude);

  const routeOverride = await resolveRoute({ routeId: payload.routeId, routeName: payload.routeName });

  const effectiveRoute = routeOverride || bus.route || (bus.routeId ? await Route.findByPk(bus.routeId) : null);
  const nextStatus = gpsOn ? "active" : "inactive";

  if (gpsOn && (!Number.isFinite(latitude) || !Number.isFinite(longitude))) {
    throw new ApiError(422, "latitude and longitude are required when GPS is on");
  }

  await bus.update({
    routeId: routeOverride ? routeOverride.id : bus.routeId,
    latitude: Number.isFinite(latitude) ? latitude : bus.latitude,
    longitude: Number.isFinite(longitude) ? longitude : bus.longitude,
    gpsEnabled: gpsOn,
    liveStatus: nextStatus,
    lastSeenAt: gpsOn ? now : bus.lastSeenAt,
    recordedAt: now,
  });

  await BusLiveLocation.create({
    busId: bus.id,
    routeId: routeOverride ? routeOverride.id : bus.routeId,
    routeName: effectiveRoute?.routeName ?? null,
    from: effectiveRoute?.from ?? null,
    to: effectiveRoute?.to ?? null,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    status: nextStatus,
    recordedAt: now,
  });

  const refreshedBus = await BusDetails.findByPk(bus.id, {
    include: [{ model: Route, as: "route", attributes: ["id", "routeName", "from", "to"] }],
  });

  const response = mapBusLiveResponse(refreshedBus);
  emitLiveTrackingUpdate(response);

  return response;
};

const getNearbyBuses = async ({
  latitude,
  longitude,
  radiusKm = DEFAULT_RADIUS_KM,
  limit = DEFAULT_LIMIT,
  includeInactive = false,
} = {}) => {
  const passengerLat = toNumber(latitude);
  const passengerLng = toNumber(longitude);
  const resolvedRadius = toNumber(radiusKm) || DEFAULT_RADIUS_KM;
  const resolvedLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), 100);

  if (!Number.isFinite(passengerLat) || !Number.isFinite(passengerLng)) {
    throw new ApiError(422, "latitude and longitude are required");
  }

  await refreshLiveStatuses();

  const buses = await BusDetails.findAll({
    where: { isActive: true },
    include: [{ model: Route, as: "route", attributes: ["id", "routeName", "from", "to"] }],
  });

  const mapped = buses
    .map((bus) => mapBusLiveResponse(bus, passengerLat, passengerLng))
    .filter((bus) => bus.latitude !== null && bus.longitude !== null)
    .filter((bus) => (includeInactive ? true : bus.status !== "inactive"))
    .filter((bus) => (bus.distanceFromPassenger === null ? false : bus.distanceFromPassenger <= resolvedRadius))
    .sort((a, b) => {
      if (a.distanceFromPassenger === null) return 1;
      if (b.distanceFromPassenger === null) return -1;
      return a.distanceFromPassenger - b.distanceFromPassenger;
    })
    .slice(0, resolvedLimit)
    .map((bus) => ({
      ...bus,
      distanceFromPassenger: bus.distanceFromPassenger === null
        ? null
        : Number(bus.distanceFromPassenger.toFixed(3)),
    }));

  return {
    passenger: { latitude: passengerLat, longitude: passengerLng },
    radiusKm: resolvedRadius,
    count: mapped.length,
    buses: mapped,
    pollingIntervalSeconds: 10,
  };
};

const getBusesByRoute = async ({
  routeId,
  routeName,
  latitude,
  longitude,
  limit = DEFAULT_LIMIT,
} = {}) => {
  const route = await resolveRoute({ routeId, routeName });
  if (!route) throw new ApiError(404, "Route not found for the provided routeName/routeId");

  const passengerLat = toNumber(latitude);
  const passengerLng = toNumber(longitude);
  const resolvedLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), 100);

  await refreshLiveStatuses();

  const buses = await BusDetails.findAll({
    where: { routeId: route.id, isActive: true },
    include: [{ model: Route, as: "route", attributes: ["id", "routeName", "from", "to"] }],
    order: [["lastSeenAt", "DESC"]],
    limit: resolvedLimit,
  });

  const hasPassengerCoords = Number.isFinite(passengerLat) && Number.isFinite(passengerLng);

  const mapped = buses
    .map((bus) => mapBusLiveResponse(bus, passengerLat, passengerLng))
    .sort((a, b) => {
      if (hasPassengerCoords) {
        if (a.distanceFromPassenger === null) return 1;
        if (b.distanceFromPassenger === null) return -1;
        return a.distanceFromPassenger - b.distanceFromPassenger;
      }

      const statusRank = { active: 0, stale: 1, inactive: 2 };
      const diff = (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9);
      if (diff !== 0) return diff;

      const aTime = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
      const bTime = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
      return bTime - aTime;
    })
    .map((bus) => ({
      ...bus,
      distanceFromPassenger: bus.distanceFromPassenger === null
        ? null
        : Number(bus.distanceFromPassenger.toFixed(3)),
    }));

  return {
    route: {
      id: route.id,
      routeName: route.routeName,
      from: route.from,
      to: route.to,
    },
    passenger: hasPassengerCoords
      ? { latitude: passengerLat, longitude: passengerLng }
      : null,
    count: mapped.length,
    buses: mapped,
    pollingIntervalSeconds: 10,
  };
};

module.exports = {
  uploadLocation,
  getNearbyBuses,
  getBusesByRoute,
};
