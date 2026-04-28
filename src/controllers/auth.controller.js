const { validationResult } = require("express-validator");
const authService = require("../services/auth.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());
    const result = await authService.login(req.body);

    ApiResponse.success(res, result, "Login successful");
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());

    const result = await authService.register(req.body);
    ApiResponse.created(res, result, "Registration successful");
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    ApiResponse.success(res, req.user);
  } catch (err) {
    next(err);
  }
};

module.exports = { login, register, me };
