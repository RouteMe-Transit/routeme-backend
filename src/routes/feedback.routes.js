const { Router } = require("express");
const feedbackController = require("../controllers/feedback.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { feedbackValidation } = require("../middlewares/validate.middleware");

const router = Router();

// Passenger routes
router.post("/", authenticate, feedbackValidation.create, feedbackController.create);

// Admin routes
router.get("/", authenticate, authorize("admin"), feedbackController.getAll);
router.get("/:id", authenticate, authorize("admin"), feedbackController.getById);

module.exports = router;