const { validationResult } = require("express-validator");
const routeService = require("../services/route.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const getAll = async (req, res, next) => {
  try { ApiResponse.success(res, await routeService.getAll(req.query)); }
  catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try { ApiResponse.success(res, await routeService.getById(req.params.id)); }
  catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());
    ApiResponse.created(res, await routeService.create(req.body));
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try { ApiResponse.success(res, await routeService.update(req.params.id, req.body), "Route updated"); }
  catch (err) { next(err); }
};

const suspend = async (req, res, next) => {
  try {
    const route = await routeService.suspend(req.params.id);
    ApiResponse.success(res, route, `Route ${route.isActive ? "activated" : "suspended"} successfully`);
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try { await routeService.remove(req.params.id); ApiResponse.success(res, null, "Route deleted"); }
  catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove, suspend };