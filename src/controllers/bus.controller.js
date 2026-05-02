const { validationResult } = require("express-validator");
const busService = require("../services/bus.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const getAll = async (req, res, next) => {
  try {
    const result = await busService.getAll(req.query);
    ApiResponse.success(res, result);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const bus = await busService.getById(req.params.id);
    ApiResponse.success(res, bus);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());
    const bus = await busService.create(req.body);
    ApiResponse.created(res, bus, "Bus registered successfully");
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const bus = await busService.update(req.params.id, req.body);
    ApiResponse.success(res, bus, "Bus updated successfully");
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await busService.remove(req.params.id);
    ApiResponse.success(res, null, "Bus removed successfully");
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await busService.getStats();
    ApiResponse.success(res, stats);
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove, getStats };