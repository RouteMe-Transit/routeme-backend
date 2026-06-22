const { validationResult } = require("express-validator");
const liveTrackingService = require("../services/live-tracking.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const assertValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(422, "Validation failed", errors.array());
  }
};

const uploadLocation = async (req, res, next) => {
  try {
    assertValidation(req);
    const result = await liveTrackingService.uploadLocation(req.user.id, req.body);
    ApiResponse.success(res, result, "Live location updated");
  } catch (err) {
    next(err);
  }
};

const getNearbyBuses = async (req, res, next) => {
  try {
    const query = { ...req.query };
    const result = await liveTrackingService.getNearbyBuses(query);
    ApiResponse.success(res, result, "Nearby buses fetched");
  } catch (err) {
    next(err);
  }
};

const getBusesByRoute = async (req, res, next) => {
  try {
    const query = { ...req.query };
    const result = await liveTrackingService.getBusesByRoute(query);
    ApiResponse.success(res, result, "Route buses fetched");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadLocation,
  getNearbyBuses,
  getBusesByRoute,
};
