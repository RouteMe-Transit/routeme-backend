const { validationResult } = require("express-validator");
const newsService = require("../services/news.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const getAll = async (req, res, next) => {
  try {
    const { page, limit, category, publishedOnly } = req.query;
    const result = await newsService.getAllNews({ page, limit, category, publishedOnly });
    ApiResponse.success(res, result);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const news = await newsService.getNewsById(req.params.id);
    ApiResponse.success(res, news);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());

    const news = await newsService.createNews(req.body);
    ApiResponse.created(res, news);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());

    const news = await newsService.updateNews(req.params.id, req.body);
    ApiResponse.success(res, news, "News updated successfully");
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await newsService.deleteNews(req.params.id);
    ApiResponse.success(res, null, "News deleted successfully");
  } catch (err) {
    next(err);
  }
};

const publish = async (req, res, next) => {
  try {
    const news = await newsService.publishNews(req.params.id);
    ApiResponse.success(res, news, "News published successfully");
  } catch (err) {
    next(err);
  }
};

const unpublish = async (req, res, next) => {
  try {
    const news = await newsService.unpublishNews(req.params.id);
    ApiResponse.success(res, news, "News unpublished successfully");
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove, publish, unpublish };
