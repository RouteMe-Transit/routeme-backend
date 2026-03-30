const { validationResult } = require("express-validator");
const busService = require("../services/bus.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const getAll = async (req, res, next) => {
  try {
    const { page, limit, status, busType } = req.query;
    const result = await busService.getAllBuses({ page, limit, status, busType });
    ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const bus = await busService.getBusById(req.params.id);
    ApiResponse.success(res, bus);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());

    const bus = await busService.createBus(req.body);
    ApiResponse.created(res, bus, "Bus registered successfully");
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());

    const bus = await busService.updateBus(req.params.id, req.body);
    ApiResponse.success(res, bus, "Bus updated successfully");
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await busService.deleteBus(req.params.id);
    ApiResponse.success(res, null, "Bus deactivated successfully");
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };