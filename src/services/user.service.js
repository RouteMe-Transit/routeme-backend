const { User } = require("../models");
const ApiError = require("../utils/ApiError");

const getAllUsers = async ({ page = 1, limit = 10, role } = {}) => {
  const offset = (page - 1) * limit;
  const where = {};
  if (role) where.role = role;

  const { count, rows } = await User.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
  });

  return {
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / limit),
    users: rows,
  };
};

const getUserById = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

const getUserByEmail = async (email) => {
  return User.scope("withPassword").findOne({ where: { email } });
};

const getUserByUserName = async (userName) => {
  return User.scope("withPassword").findOne({ where: { userName } });
};

const createUser = async (data) => {
  const existingEmail = await User.findOne({ where: { email: data.email } });
  if (existingEmail) throw new ApiError(409, "Email already in use");

  const existingUserName = await User.findOne({ where: { userName: data.userName } });
  if (existingUserName) throw new ApiError(409, "Username already taken");

  return User.create(data);
};

const updateUser = async (id, data) => {
  const user = await getUserById(id);

  if (data.email && data.email !== user.email) {
    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) throw new ApiError(409, "Email already in use");
  }

  if (data.userName && data.userName !== user.userName) {
    const existing = await User.findOne({ where: { userName: data.userName } });
    if (existing) throw new ApiError(409, "Username already taken");
  }

  await user.update(data);
  return user;
};

const deleteUser = async (id) => {
  const user = await getUserById(id);
  await user.update({ isActive: false });
};

module.exports = {
  getAllUsers,
  getUserById,
  getUserByEmail,
  getUserByUserName,
  createUser,
  updateUser,
  deleteUser,
};
