const { validationResult } = require("express-validator");
const stopService = require("../services/stop.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const getAll = async (req, res, next) => {
  try {
    const { page, limit, search, id, activeOnly } = req.query;
    ApiResponse.success(res, await stopService.getAll({ page, limit, search, id, activeOnly }));
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    ApiResponse.success(res, await stopService.getStats());
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try { ApiResponse.success(res, await stopService.getById(req.params.id)); }
  catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());
    ApiResponse.created(res, await stopService.create(req.body));
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try { ApiResponse.success(res, await stopService.update(req.params.id, req.body), "Stop updated"); }
  catch (err) { next(err); }
};

const toggleActive = async (req, res, next) => {
  try { ApiResponse.success(res, await stopService.toggleActive(req.params.id)); }
  catch (err) { next(err); }
};

module.exports = { getAll, getStats, getById, create, update, toggleActive };