const { validationResult } = require("express-validator");
const complaintService = require("../services/complaint.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const getAll = async (req, res, next) => {
  try {
    const { page, limit, status, category, search } = req.query;
    const result = await complaintService.getAllComplaints({
      page,
      limit,
      status,
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
    const complaint = await complaintService.getComplaintById(req.params.id);
    ApiResponse.success(res, complaint);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());

    const complaintData = {
      ...req.body,
      userId: req.user.id, // from auth middleware
    };
    const complaint = await complaintService.createComplaint(complaintData);
    ApiResponse.created(res, complaint);
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(422, "Validation failed", errors.array());

    const complaint = await complaintService.updateComplaintStatus(
      req.params.id,
      req.body.status
    );
    ApiResponse.success(res, complaint, "Complaint status updated successfully");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  updateStatus,
};