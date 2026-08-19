const { Router } = require("express");
const reportController = require("../controllers/report.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { body } = require("express-validator");

const router = Router();

const createValidation = [
  body("content").trim().notEmpty().withMessage("Report content is required"),
  body("busNumber").optional().trim(),
];

// Driver/passenger/bus can create report (authenticated)
router.post("/", authenticate, createValidation, reportController.create);

// Admin routes
router.get("/", authenticate, authorize("admin"), reportController.getAll);
router.get("/:id", authenticate, authorize("admin"), reportController.getById);

module.exports = router;
