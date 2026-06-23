const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authValidation } = require("../middlewares/validate.middleware");

const router = Router();

router.post("/login", authValidation.login, authController.login);
router.post("/register", authValidation.register, authController.register);
router.get("/me", authenticate, authController.me);
router.post("/forgot-password", authValidation.forgotPassword, authController.forgotPassword); // This route will handle the forgot password request and send an OTP to the user's email if the email exists in the system
router.post("/verify-reset-otp", authValidation.verifyResetOTP, authController.verifyResetOTP); // This route will verify the OTP sent to the user's email and allow them to reset their password if the OTP is valid
router.post("/reset-password", authValidation.resetPassword, authController.resetPassword);// This route will allow the user to reset their password after verifying the OTP

module.exports = router;
