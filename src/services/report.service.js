const { Report, User } = require("../models");
const ApiError = require("../utils/ApiError");

const createReport = async (data) => {
  return Report.create(data);
};

const getAllReports = async ({ page = 1, limit = 20, search } = {}) => {
  const offset = (page - 1) * limit;
  const where = {};
  const { Op } = require("sequelize");

  if (search) {
    where[Op.or] = [
      { busNumber: { [Op.like]: `%${search}%` } },
      { content: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Report.findAndCountAll({
    where,
    include: [
      { model: User, as: "user", attributes: ["id", "firstName", "lastName", "email"] },
    ],
    order: [["createdAt", "DESC"]],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  return {
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / limit),
    reports: rows,
  };
};

const getReportById = async (id) => {
  const report = await Report.findByPk(id, {
    include: [{ model: User, as: "user", attributes: ["id", "firstName", "lastName", "email"] }],
  });
  if (!report) throw new ApiError(404, "Report not found");
  return report;
};

module.exports = { createReport, getAllReports, getReportById };
