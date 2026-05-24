//this file contains bus-specific trip operations like getting today's trips, trip stops, and updating trip status. It uses the Trip, Route, BusDetails, RouteStop, and Stop models to fetch and manipulate data related to bus trips. The service functions handle business logic and return structured responses for the controllers to send back to clients.
const { Op, where, literal } = require("sequelize");
const { Trip, Route, BusDetails, RouteStop, Stop } = require("../models");
const ApiError = require("../utils/ApiError");

const STATUS_LABELS = {
  scheduled: "start",
  active: "ongoing",
  delayed: "ongoing",
  completed: "finished",
  cancelled: "cancelled",
};

const STATUS_UPDATES = {
  start: "active",
  active: "active",
  ongoing: "active",
  finish: "completed",
  finished: "completed",
  completed: "completed",
  delayed: "delayed",
  cancelled: "cancelled",
};

const STORED_STATUS_ALIASES = {
  start: "scheduled",
  upcoming: "scheduled",
  ongoing: "active",
  finish: "completed",
  finished: "completed",
};

const getStatusLabel = (status) => STATUS_LABELS[status] ?? status;

const normalizeStatusUpdate = (status) => STATUS_UPDATES[status] ?? status;

const normalizeStoredTripStatus = (status) => STORED_STATUS_ALIASES[status] ?? status;

const getEffectiveTripStatus = (trip) => {
  if (!trip) return null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const updatedAt = trip.updatedAt ? new Date(trip.updatedAt) : null;
  const normalizedStoredStatus = normalizeStoredTripStatus(trip.status);

  if (normalizedStoredStatus === "completed" && updatedAt && updatedAt < startOfToday) {
    return "scheduled";
  }

  return normalizedStoredStatus;
};

// Get today's trips for a specific bus
const getTodayTrips = async (busId) => {
  const bus = await BusDetails.findByPk(busId);
  if (!bus) throw new ApiError(404, "Bus not found");

  // Get today's day name (e.g., 'Mon', 'Tue')
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayDay = days[new Date().getDay()];

  const trips = await Trip.findAll({
    where: {
      busId,
      isActive: true,
      [Op.and]: where(literal(`JSON_CONTAINS(days, '"${todayDay}"')`), true),
    },
    include: [
      { model: Route, as: "route", attributes: ["id", "routeName", "from", "to"] },
    ],
    order: [["departureTime", "ASC"]],
  });

  return {
    busId,
    registrationNumber: bus.registrationNumber,
    todayDay,
    trips: trips.map((trip) => {
      // treat completed trips from previous days as scheduled for today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const lastUpdate = trip.updatedAt ? new Date(trip.updatedAt) : null;
      const normalizedStoredStatus = normalizeStoredTripStatus(trip.status);

      let displayStatus = normalizedStoredStatus;
      if (normalizedStoredStatus === "completed" && lastUpdate && lastUpdate < startOfToday) {
        displayStatus = "scheduled";
      }

      return {
        id: trip.id,
        tripNumber: trip.id,
        routeName: trip.route.routeName,
        direction: `${trip.route.from} - ${trip.route.to}`,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        status: normalizedStoredStatus,
        displayStatus,
        statusLabel: getStatusLabel(displayStatus),
        nextStatusLabel: displayStatus === "scheduled"
          ? "ongoing"
          : displayStatus === "active" || displayStatus === "delayed"
            ? "finished"
            : null,
        isActive: trip.isActive,
      };
    }),
  };
};

// Get trip stops with current status
const getTripStops = async (tripId, busId) => {
  const trip = await Trip.findByPk(tripId, {
    include: [
      { model: Route, as: "route", attributes: ["id", "routeName", "from", "to"] },
    ],
  });
  if (!trip) throw new ApiError(404, "Trip not found");
  if (trip.busId !== busId) throw new ApiError(403, "This bus is not assigned to this trip");

  const routeStops = await RouteStop.findAll({
    where: { routeId: trip.routeId },
    include: [
      { model: Stop, as: "stop", attributes: ["id", "stopName", "latitude", "longitude"] },
    ],
    order: [["stopSequence", "ASC"]],
  });

  // reverse stop order for return trips so sequence reflects travel direction
  const stopsOrdered = trip.direction === "return"
    ? routeStops.slice().reverse()
    : routeStops;

  return {
    tripId: trip.id,
    tripNumber: trip.id,
    routeName: trip.route?.routeName,
    direction: trip.direction === "return"
      ? `${trip.route?.to} - ${trip.route?.from}`
      : `${trip.route?.from} - ${trip.route?.to}`,
    departureTime: trip.departureTime,
    arrivalTime: trip.arrivalTime,
    currentStatus: trip.status,
    statusLabel: getStatusLabel(trip.status),
    stops: stopsOrdered.map((rs, idx) => ({
      sequence: idx + 1,
      stopId: rs.stopId,
      stopName: rs.stop.stopName,
      latitude: rs.stop.latitude,
      longitude: rs.stop.longitude,
      scheduledTime: rs.time,
      status: "upcoming", // TODO: track actual bus progress through stops
      estimatedArrival: rs.time,
    })),
  };
};

// Update trip status (start, ongoing, finished)
const updateTripStatus = async (tripId, busId, newStatus) => {
  const trip = await Trip.findByPk(tripId);
  if (!trip) throw new ApiError(404, "Trip not found");
  if (trip.busId !== busId) throw new ApiError(403, "This bus is not assigned to this trip");

  const targetStatus = normalizeStatusUpdate(newStatus);
  const currentStatus = getEffectiveTripStatus(trip);

  // Validate status transition
  const validStatuses = ["scheduled", "active", "delayed", "completed", "cancelled"];
  if (!validStatuses.includes(targetStatus)) {
    console.warn("[bus-trip] invalid requested status", {
      tripId,
      busId,
      requestedStatus: newStatus,
      normalizedStatus: targetStatus,
      currentDbStatus: trip.status,
      normalizedStoredStatus: normalizeStoredTripStatus(trip.status),
    });
    throw new ApiError(422, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  // Allow transition: scheduled -> active, active -> completed
  if (currentStatus === "scheduled" && targetStatus !== "active") {
    console.warn("[bus-trip] invalid transition from scheduled", {
      tripId,
      busId,
      requestedStatus: newStatus,
      normalizedStatus: targetStatus,
      currentDbStatus: trip.status,
      normalizedStoredStatus: normalizeStoredTripStatus(trip.status),
      effectiveCurrentStatus: currentStatus,
    });
    throw new ApiError(422, "Can only change from scheduled to active");
  }
  if (currentStatus === "active" && !["completed", "delayed", "cancelled"].includes(targetStatus)) {
    console.warn("[bus-trip] invalid transition from active", {
      tripId,
      busId,
      requestedStatus: newStatus,
      normalizedStatus: targetStatus,
      currentDbStatus: trip.status,
      normalizedStoredStatus: normalizeStoredTripStatus(trip.status),
      effectiveCurrentStatus: currentStatus,
    });
    throw new ApiError(422, "Can only change from active to completed, delayed, or cancelled");
  }
  if (currentStatus === "completed") {
    console.warn("[bus-trip] attempted update on completed trip", {
      tripId,
      busId,
      requestedStatus: newStatus,
      normalizedStatus: targetStatus,
      currentDbStatus: trip.status,
      normalizedStoredStatus: normalizeStoredTripStatus(trip.status),
      effectiveCurrentStatus: currentStatus,
    });
    throw new ApiError(422, "Cannot update a completed trip");
  }

  await trip.update({ status: targetStatus });
  const updatedTrip = await Trip.findByPk(tripId, {
    include: [
      { model: Route, as: "route", attributes: ["id", "routeName", "from", "to"] },
      { model: BusDetails, as: "bus", attributes: ["id", "registrationNumber", "busType"] },
    ],
  });
  
  return {
    id: updatedTrip.id,
    tripNumber: updatedTrip.id,
    status: updatedTrip.status,
    statusLabel: getStatusLabel(updatedTrip.status),
    trip: updatedTrip,
    message: `Trip status changed to ${targetStatus}`,
  };
};

module.exports = { getTodayTrips, getTripStops, updateTripStatus };
