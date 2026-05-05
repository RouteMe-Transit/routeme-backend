const jwt = require("jsonwebtoken");
const config = require("../config");
const userService = require("./user.service");
const ApiError = require("../utils/ApiError");
const { BusDetails } = require("../models");

const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};

const login = async ({ email, phone, registrationNumber, password }) => {
  let user;

  // Bus login ONLY with registration number
  if (registrationNumber) {
    const bus = await BusDetails.findOne({ where: { registrationNumber } });
    if (!bus) throw new ApiError(401, "Invalid credentials");
    user = await userService.getUserById(bus.userId);
  } else if (email || phone) {
    // Regular user login with email or phone (NOT for buses)
    user = email ? await userService.getUserByEmail(email) : await userService.getUserByPhone(phone);
    
    // Prevent bus users from logging in with email/phone
    if (user && user.role === "bus") {
      throw new ApiError(401, "Bus accounts must log in using registration number and password");
    }
  } else {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!user) throw new ApiError(401, "Invalid credentials");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  if (!user.isActive) throw new ApiError(403, "Account is deactivated");

  const token = generateToken({ id: user.id, role: user.role });

  const { password: _, ...userWithoutPassword } = user.toJSON();
  return { token, user: userWithoutPassword };
};

const register = async (data) => {
  const user = await userService.createUser(data, { createdByAdmin: false });
  const token = generateToken({ id: user.id, role: user.role });
  return { token, user };
};

module.exports = { login, register, generateToken };
