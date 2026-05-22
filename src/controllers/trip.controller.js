const { validationResult } = require("express-validator");
const tripService = require("../services/trip.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError    = require("../utils/ApiError");

const getAll = async (req, res, next) => {
  try {
    const result = await tripService.getAll(req.query);
    ApiResponse.success(res, result);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const trip = await tripService.getById(req.params.id);
    ApiResponse.success(res, trip);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());
    const trip = await tripService.create(req.body);
    ApiResponse.created(res, trip, "Trip created successfully");
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());
    const trip = await tripService.update(req.params.id, req.body);
    ApiResponse.success(res, trip, "Trip updated successfully");
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());
    const trip = await tripService.updateStatus(req.params.id, req.body.status);
    ApiResponse.success(res, trip, "Trip status updated successfully");
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const result = await tripService.remove(req.params.id);
    ApiResponse.success(res, result);
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await tripService.getStats();
    ApiResponse.success(res, stats);
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, updateStatus, remove, getStats };