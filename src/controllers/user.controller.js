const { validationResult } = require("express-validator");
const userService = require("../services/user.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const getAll = async (req, res, next) => {
  try {
    const { page, limit, role, search, id, status } = req.query;
    const result = await userService.getAllUsers({ page, limit, role, search, id, status });
    ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    ApiResponse.success(res, user);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());

    const user = await userService.createUser(req.body, { createdByAdmin: true });
    ApiResponse.created(res, user);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());

    const user = await userService.updateUser(req.params.id, req.body);
    ApiResponse.success(res, user, "User updated successfully");
  } catch (err) {
    next(err);
  }
};

const getMyFavoriteRoutes = async (req, res, next) => {
  try {
    const { search } = req.query;
    const result = await userService.getPassengerFavoriteRoutes(req.user.id, { search });
    ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

const addMyFavoriteRoute = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());

    const user = await userService.addPassengerFavoriteRoute(req.user.id, req.body.routeId);
    ApiResponse.success(res, user, "Route added to favorites successfully");
  } catch (err) {
    next(err);
  }
};

const removeMyFavoriteRoute = async (req, res, next) => {
  try {
    const user = await userService.removePassengerFavoriteRoute(req.user.id, req.params.routeId);
    ApiResponse.success(res, user, "Route removed from favorites successfully");
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    ApiResponse.success(res, null, "User deactivated successfully");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  getMyFavoriteRoutes,
  addMyFavoriteRoute,
  removeMyFavoriteRoute,
  remove,
};