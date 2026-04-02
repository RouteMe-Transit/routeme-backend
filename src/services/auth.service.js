const jwt = require("jsonwebtoken");
const config = require("../config");
const userService = require("./user.service");
const ApiError = require("../utils/ApiError");

const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};

const login = async ({ email, password }) => {
  const user = await userService.getUserByEmail(email);
  if (!user) throw new ApiError(401, "Invalid credentials");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  if (!user.isActive) throw new ApiError(403, "Account is deactivated");

  const token = generateToken({ id: user.id, role: user.role });

  const { password: _, ...userWithoutPassword } = user.toJSON();
  return { token, user: userWithoutPassword };
};

const register = async (data) => {
  const user = await userService.createUser(data);
  const token = generateToken({ id: user.id, role: user.role });
  return { token, user };
};

module.exports = { login, register, generateToken };
