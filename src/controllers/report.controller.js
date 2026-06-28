const { validationResult } = require("express-validator");
const reportService = require("../services/report.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());

    const reportData = {
      userId: req.user ? req.user.id : null,
      busNumber: req.body.busNumber || null,
      content: req.body.content,
    };

    const report = await reportService.createReport(reportData);
    ApiResponse.created(res, report, "Bus report submitted successfully");
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const result = await reportService.getAllReports({ page, limit, search });
    ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const report = await reportService.getReportById(req.params.id);
    ApiResponse.success(res, report);
  } catch (err) {
    next(err);
  }
};

module.exports = { create, getAll, getById };
