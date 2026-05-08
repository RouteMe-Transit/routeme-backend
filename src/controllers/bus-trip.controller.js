// Controller for bus trip-related endpoints. It handles requests for getting today's trips, fetching stops for a specific trip, and updating trip status. The controller interacts with the busTripService to perform business logic and returns structured responses using ApiResponse and ApiError utilities.
const { validationResult } = require("express-validator");
const busTripService = require("../services/bus-trip.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

// Get today's trips for the logged-in bus
const getTodayTrips = async (req, res, next) => {
  try {
    const { BusDetails } = require("../models");
    
    // Get the bus associated with this user
    const bus = await BusDetails.findOne({ where: { userId: req.user.id } });
    if (!bus) throw new ApiError(404, "Bus not found for this user");

    const result = await busTripService.getTodayTrips(bus.id);
    ApiResponse.success(res, result, "Today's trips retrieved successfully");
  } catch (err) {
    next(err);
  }
};

// Get stops for a specific trip
const getTripStops = async (req, res, next) => {
  try {
    const { BusDetails } = require("../models");
    const tripId = req.params.tripId;

    // Get the bus associated with this user
    const bus = await BusDetails.findOne({ where: { userId: req.user.id } });
    if (!bus) throw new ApiError(404, "Bus not found for this user");

    const result = await busTripService.getTripStops(tripId, bus.id);
    ApiResponse.success(res, result, "Trip stops retrieved successfully");
  } catch (err) {
    next(err);
  }
};

// Update trip status (start, ongoing, finished)
const updateTripStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());

    const { BusDetails } = require("../models");
    const tripId = req.params.tripId;
    const { status } = req.body;

    // Get the bus associated with this user
    const bus = await BusDetails.findOne({ where: { userId: req.user.id } });
    if (!bus) throw new ApiError(404, "Bus not found for this user");

    const result = await busTripService.updateTripStatus(tripId, bus.id, status);
    ApiResponse.success(res, result, "Trip status updated successfully");
  } catch (err) {
    next(err);
  }
};

module.exports = { getTodayTrips, getTripStops, updateTripStatus };
