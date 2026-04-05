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

const getUserByPhone = async (phone) => {
  return User.scope("withPassword").findOne({ where: { phone } });
};

const createUser = async (data, options = {}) => {
  const { createdByAdmin = false } = options;

  const existingEmail = await User.findOne({ where: { email: data.email } });
  if (existingEmail) throw new ApiError(409, "Email already in use");

  if (data.phone) {
    const existingPhone = await User.findOne({ where: { phone: data.phone } });
    if (existingPhone) throw new ApiError(409, "Phone already in use");
  }

  const payload = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    password: data.password,
    isActive: data.isActive,
  };

  if (createdByAdmin) {
    if (!["admin", "bus"].includes(data.role)) {
      throw new ApiError(422, "Admin can only create admin or bus accounts");
    }
    payload.role = data.role;
  } else {
    payload.role = "passenger";
  }

  return User.create(payload);
};

const updateUser = async (id, data) => {
  const user = await getUserById(id);

  if (data.email && data.email !== user.email) {
    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) throw new ApiError(409, "Email already in use");
  }

  if (data.phone && data.phone !== user.phone) {
    const existing = await User.findOne({ where: { phone: data.phone } });
    if (existing) throw new ApiError(409, "Phone already in use");
  }

  const payload = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    password: data.password,
    role: data.role,
    isActive: data.isActive,
  };

  await user.update(payload);
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
  getUserByPhone,
  createUser,
  updateUser,
  deleteUser,
};
