const { validationResult } = require("express-validator");
const routeFinderService = require("../services/route-finder.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

// GET /route-finder?from=&to=&date=&time=
const search = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());

    const { from, to, date, time } = req.query;
    const result = await routeFinderService.search({ from, to, date, time });
    ApiResponse.success(res, result.routes, "Success");
  } catch (err) { next(err); }
};

// GET /route-finder/:id  (id from a previous /route-finder search result)
const getDetails = async (req, res, next) => {
  try {
    const { date, time } = req.query;
    const details = await routeFinderService.getDetails(req.params.id, { date, time });
    ApiResponse.success(res, details, "Success");
  } catch (err) { next(err); }
};

module.exports = { search, getDetails };