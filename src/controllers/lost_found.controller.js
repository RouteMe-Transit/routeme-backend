const { validationResult } = require("express-validator");
const lostFoundService = require("../services/lost_found.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const getAll = async (req, res, next) => {
  try {
    const { page, limit, itemType, status, search } = req.query;
    const result = await lostFoundService.getAllLostFound({
      page,
      limit,
      itemType,
      status,
      search,
    });
    ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

const getMyItems = async (req, res, next) => {
  try {
    const { page, limit, itemType, status, search } = req.query;
    const result = await lostFoundService.getMyItems(req.user.id, {
      page,
      limit,
      itemType,
      status,
      search,
    });
    ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const item = await lostFoundService.getLostFoundById(req.params.id);
    ApiResponse.success(res, item);
  } catch (err) {
    next(err);
  }
};

const getWeeklyCount = async (req, res, next) => {
  try {
    const result = await lostFoundService.getWeeklyReportsCount();
    ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(422, "Validation failed", errors.array());
    }

    const item = await lostFoundService.createLostFound(
      req.body,
      req.file,
      req.user?.id
    );
    ApiResponse.created(res, item, "Lost & Found item reported successfully");
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(422, "Validation failed", errors.array());
    }

    const item = await lostFoundService.updateLostFound(
      req.params.id,
      req.body,
      req.file,
      req.user?.id,
      req.user?.role
    );
    ApiResponse.success(res, item, "Lost & Found item updated successfully");
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(422, "Validation failed", errors.array());
    }

    const item = await lostFoundService.updateStatus(
      req.params.id,
      req.body.status,
      req.user?.id,
      req.user?.role
    );
    ApiResponse.success(res, item, "Item status updated successfully");
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await lostFoundService.deleteLostFound(
      req.params.id,
      req.user?.id,
      req.user?.role
    );
    ApiResponse.success(res, null, "Lost & Found item deleted successfully");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getMyItems,
  getById,
  getWeeklyCount,
  create,
  update,
  updateStatus,
  remove,
};
