const { Complaint, User } = require("../models");
const ApiError = require("../utils/ApiError");

const getAllComplaints = async ({
  page = 1,
  limit = 10,
  status,
  category,
  search,
} = {}) => {
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (search) {
    where[require("sequelize").Op.or] = [
      { busNumber: { [require("sequelize").Op.like]: `%${search}%` } },
      { description: { [require("sequelize").Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Complaint.findAndCountAll({
    where,
    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
  });

  return {
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / limit),
    complaints: rows,
  };
};

const getComplaintById = async (id) => {
  const complaint = await Complaint.findByPk(id, {
    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
  });
  if (!complaint) throw new ApiError(404, "Complaint not found");
  return complaint;
};

const createComplaint = async (data) => {
  return Complaint.create(data);
};

const updateComplaintStatus = async (id, status) => {
  const complaint = await getComplaintById(id);
  await complaint.update({ status });
  return complaint;
};

module.exports = {
  getAllComplaints,
  getComplaintById,
  createComplaint,
  updateComplaintStatus,
};