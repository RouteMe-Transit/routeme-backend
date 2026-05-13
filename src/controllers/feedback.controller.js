const { validationResult } = require("express-validator");
const feedbackService = require("../services/feedback.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const getAll = async (req, res, next) => {
  try {
    const { page, limit, rating, category, search } = req.query;
    const result = await feedbackService.getAllFeedbacks({
      page,
      limit,
      rating,
      category,
      search,
    });
    ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const feedback = await feedbackService.getFeedbackById(req.params.id);
    ApiResponse.success(res, feedback);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());

    const feedbackData = {
      ...req.body,
      userId: req.user.id, // from auth middleware
    };
    const feedback = await feedbackService.createFeedback(feedbackData);
    ApiResponse.created(res, feedback);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  create,
};