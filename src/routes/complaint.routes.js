const { Router } = require("express");
const complaintController = require("../controllers/complaint.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { complaintValidation } = require("../middlewares/validate.middleware");

const router = Router();

// Passenger routes
router.post("/", authenticate, complaintValidation.create, complaintController.create);

// Admin routes
router.get("/", authenticate, authorize("admin"), complaintController.getAll);
router.get("/:id", authenticate, authorize("admin"), complaintController.getById);
router.patch("/:id/status", authenticate, authorize("admin"), complaintValidation.updateStatus, complaintController.updateStatus);

module.exports = router;