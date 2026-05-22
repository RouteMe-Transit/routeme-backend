<<<<<<< HEAD
const { validationResult } = require("express-validator");
const routeService = require("../services/route.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const getAll = async (req, res, next) => {
  try {
    const { page, limit, routeType } = req.query;
    const result = await routeService.getAllRoutes({ page, limit, routeType });
    ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const route = await routeService.getRouteById(req.params.id);
    ApiResponse.success(res, route);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());

    const route = await routeService.createRoute(req.body);
    ApiResponse.created(res, route, "Route created successfully");
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());

    const route = await routeService.updateRoute(req.params.id, req.body);
    ApiResponse.success(res, route, "Route updated successfully");
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await routeService.deleteRoute(req.params.id);
    ApiResponse.success(res, null, "Route deactivated successfully");
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };
=======
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
>>>>>>> f0ab595431ff891989485c94bb5c10ae7be63db7
