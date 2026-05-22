//this file contains bus-specific trip operations like getting today's trips, trip stops, and updating trip status. It uses the Trip, Route, BusDetails, RouteStop, and Stop models to fetch and manipulate data related to bus trips. The service functions handle business logic and return structured responses for the controllers to send back to clients.
const { Op, where, literal } = require("sequelize");
const { Trip, Route, BusDetails, RouteStop, Stop } = require("../models");
const ApiError = require("../utils/ApiError");

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
    trips: trips.map((trip) => ({
      id: trip.id,
      tripNumber: trip.id,
      routeName: trip.route.routeName,
      direction: `${trip.route.from} - ${trip.route.to}`,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      status: trip.status,
      isActive: trip.isActive,
    })),
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
    stops: routeStops.map((rs) => ({
      sequence: rs.stopSequence,
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

  // Validate status transition
  const validStatuses = ["scheduled", "active", "delayed", "completed", "cancelled"];
  if (!validStatuses.includes(newStatus)) {
    throw new ApiError(422, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  // Allow transition: scheduled -> active, active -> completed
  if (trip.status === "scheduled" && newStatus !== "active") {
    throw new ApiError(422, "Can only change from scheduled to active");
  }
  if (trip.status === "active" && !["completed", "delayed", "cancelled"].includes(newStatus)) {
    throw new ApiError(422, "Can only change from active to completed, delayed, or cancelled");
  }
  if (trip.status === "completed") {
    throw new ApiError(422, "Cannot update a completed trip");
  }

  await trip.update({ status: newStatus });
  
  return {
    id: trip.id,
    tripNumber: trip.id,
    status: trip.status,
    message: `Trip status changed to ${newStatus}`,
  };
};

module.exports = { getTodayTrips, getTripStops, updateTripStatus };
