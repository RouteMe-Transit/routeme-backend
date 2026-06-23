const { validationResult } = require("express-validator");
const authService = require("../services/auth.service");
const otpService = require("../services/otp.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");


const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new ApiError(
        422,
        "Validation failed",
        errors.array()
      );
    }

    const result = await authService.login(req.body);

    ApiResponse.success(
      res,
      result,
      "Login successful"
    );
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

const forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());
 
    await otpService.requestPasswordResetOTP(req.body.email);
 
    // Same response whether or not the email exists
    ApiResponse.success(res, null, "If an account exists for that email, a reset code has been sent.");
  } catch (err) {
    next(err);
  }
};
 
const verifyResetOTP = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());
 
    await otpService.verifyPasswordResetOTP(req.body.email, req.body.otp);
    ApiResponse.success(res, null, "Code verified");
  } catch (err) {
    next(err);
  }
};
 
const resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());
 
    const { email, otp, newPassword } = req.body;
    await otpService.resetPassword(email, otp, newPassword);
 
    ApiResponse.success(res, null, "Password reset successfully");
  } catch (err) {
    next(err);
  }
};

module.exports = { login, register, me, forgotPassword, verifyResetOTP, resetPassword };
