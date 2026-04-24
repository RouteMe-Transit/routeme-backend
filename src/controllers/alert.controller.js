const { validationResult } = require("express-validator");
const alertService = require("../services/alert.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());

    const alert = await alertService.createAlert(req.body, req.user.id);
    ApiResponse.created(res, alert, "Alert created successfully");
  } catch (err) {
    next(err);
  }
};

const sendBusAlert = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());

    const alert = await alertService.createBusRouteAlert({
      alertType: req.body.alertType,
      busUser: req.user,
    });

    ApiResponse.created(res, alert, "Bus alert sent successfully");
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const alert = await alertService.getAlertById(req.params.id);
    ApiResponse.success(res, alert);
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const { page, limit, status, createdBy } = req.query;
    const result = await alertService.getAlertHistoryByAdmin({ page, limit, status, createdBy });
    ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

const getPassengerFeed = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await alertService.getPassengerVisibleAlerts({
      passenger: req.user,
      page,
      limit,
    });

    ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

const getBusHistory = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await alertService.getAlertHistoryByBus({
      page,
      limit,
      busId: req.user.id,
    });
    ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = { create, sendBusAlert, getById, getHistory, getBusHistory, getPassengerFeed };
