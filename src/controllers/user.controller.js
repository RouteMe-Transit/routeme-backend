const { validationResult } = require("express-validator");
const userService = require("../services/user.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const getAll = async (req, res, next) => {
  try {
    const { page, limit, role } = req.query;
    const result = await userService.getAllUsers({ page, limit, role });
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

    const user = await userService.createUser(req.body);
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

const remove = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    ApiResponse.success(res, null, "User deactivated successfully");
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };
