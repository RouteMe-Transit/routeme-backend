const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { authValidation } = require("../middlewares/validate.middleware");

const router = Router();

router.post("/login", authValidation.login, authController.login);
router.post("/register", authValidation.register, authController.register);
router.get("/me", authenticate, authController.me);

module.exports = router;
