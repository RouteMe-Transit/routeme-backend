const jwt = require("jsonwebtoken");
const config = require("../config");
const userService = require("./user.service");
const ApiError = require("../utils/ApiError");
const { BusDetails, User } = require("../models");

const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};

const login = async ({
  email,
  registrationNumber,
  password,
}) => {
  let user;

  // =========================
  // BUS LOGIN
  // =========================
  
  if (registrationNumber) {
    const bus = await BusDetails.findOne({
      where: { registrationNumber },
    });


    if (!bus) {
      throw new ApiError(
        401,
        "Invalid registration number or password"
      );
    }

    user = await User.scope("withPassword").findByPk(
      bus.userId
    );

    if (!user) {
      throw new ApiError(
        401,
        "Bus account not found"
      );
    }

    // Ensure role is bus
    if (user.role !== "bus") {
      throw new ApiError(
        401,
        "Invalid bus account"
      );
    }
  }

  // =========================
  // EMAIL LOGIN
  // =========================
  else if (email) {
    user = await userService.getUserByEmail(email);

    if (!user) {
      throw new ApiError(
        401,
        "Invalid email or password"
      );
    }

    if (user.role === "bus") {
      throw new ApiError(
        401,
        "Bus accounts must login using registration number"
      );
    }

    user = await User.scope("withPassword").findByPk(
      user.id
    );
  }

  // =========================
  // INVALID
  // =========================
  else {
    throw new ApiError(
      401,
      "Invalid credentials"
    );
  }

  // =========================
  // PASSWORD CHECK
  // =========================
  const isMatch = await user.comparePassword(
    password
  );

  if (!isMatch) {
    throw new ApiError(
      401,
      "Invalid credentials"
    );
  }

  // =========================
  // ACTIVE CHECK
  // =========================
  if (!user.isActive) {
    throw new ApiError(
      403,
      "Account is deactivated"
    );
  }

  // =========================
  // TOKEN
  // =========================
  const token = generateToken({
    id: user.id,
    role: user.role,
  });

  const {
    password: _,
    ...userWithoutPassword
  } = user.toJSON();

  return {
    token,
    user: userWithoutPassword,
  };
};

const register = async (data) => {
  const user = await userService.createUser(data, { createdByAdmin: false });
  const token = generateToken({ id: user.id, role: user.role });
  return { token, user };
};

module.exports = { login, register, generateToken };
