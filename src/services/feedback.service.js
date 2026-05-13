const { Feedback, User } = require("../models");
const ApiError = require("../utils/ApiError");

const getAllFeedbacks = async ({
  page = 1,
  limit = 10,
  rating,
  category,
  search,
} = {}) => {
  const offset = (page - 1) * limit;

  const where = {};
  if (rating) where.rating = rating;
  if (category) where.category = category;
  if (search) {
    where[require("sequelize").Op.or] = [
      { busNumber: { [require("sequelize").Op.like]: `%${search}%` } },
      { message: { [require("sequelize").Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Feedback.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: "user",
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
    feedbacks: rows,
  };
};

const getFeedbackById = async (id) => {
  const feedback = await Feedback.findByPk(id, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ],
  });
  if (!feedback) throw new ApiError(404, "Feedback not found");
  return feedback;
};

const createFeedback = async (data) => {
  return Feedback.create(data);
};

module.exports = {
  getAllFeedbacks,
  getFeedbackById,
  createFeedback,
};