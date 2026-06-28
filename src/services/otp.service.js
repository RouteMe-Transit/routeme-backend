const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { OTP } = require("../models");
const userService = require("./user.service");
const { sendOTPEmail } = require("../utils/mailer");
const ApiError = require("../utils/ApiError");

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

const generateOTP = () => `${Math.floor(100000 + Math.random() * 900000)}`; // 6-digit, zero-safe

const requestPasswordResetOTP = async (email) => {
  const user = await userService.getUserByEmail(email);

  // Don't reveal whether the email exists — same response either way
  if (!user) return;

  const existing = await OTP.findOne({
    where: { email, isUsed: false },
    order: [["createdAt", "DESC"]],
  });

  if (existing) {
    const secondsSinceCreated = (Date.now() - new Date(existing.createdAt).getTime()) / 1000;
    if (secondsSinceCreated < RESEND_COOLDOWN_SECONDS) {
      throw new ApiError(429, "Please wait before requesting another code");
    }
  }

  // Invalidate any previous unused OTPs for this email
  await OTP.destroy({ where: { email, isUsed: false } });

  const plainOTP = generateOTP();
  const hashedOTP = await bcrypt.hash(plainOTP, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await OTP.create({ email, otp: hashedOTP, expiresAt });

  await sendOTPEmail(email, plainOTP);
};

const verifyPasswordResetOTP = async (email, submittedOTP) => {
  const record = await OTP.findOne({
    where: { email, isUsed: false },
    order: [["createdAt", "DESC"]],
  });

  if (!record) throw new ApiError(400, "No active code for this email. Please request a new one.");

  if (new Date() > new Date(record.expiresAt)) {
    await record.destroy();
    throw new ApiError(400, "Code has expired. Please request a new one.");
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await record.destroy();
    throw new ApiError(429, "Too many incorrect attempts. Please request a new code.");
  }

  const isMatch = await bcrypt.compare(`${submittedOTP}`, record.otp);
  if (!isMatch) {
    await record.increment("attempts");
    throw new ApiError(400, "Invalid code");
  }

  return record;
};

const resetPassword = async (email, submittedOTP, newPassword) => {
  const record = await verifyPasswordResetOTP(email, submittedOTP);

  const user = await userService.getUserByEmail(email);
  if (!user) throw new ApiError(404, "User not found");

  await user.update({ password: newPassword }); // beforeUpdate hook hashes it

  record.isUsed = true;
  await record.save();

  // Clean up any other stray unused OTPs for this email
  await OTP.destroy({ where: { email, isUsed: false, id: { [Op.ne]: record.id } } });
};

module.exports = {
  requestPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword,
};