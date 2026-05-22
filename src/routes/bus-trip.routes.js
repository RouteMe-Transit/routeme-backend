const { Router } = require("express");
const c = require("../controllers/bus-trip.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { body } = require("express-validator");

const router = Router();

// All bus trip endpoints require bus role
router.use(authenticate, authorize("bus"));

// Get today's scheduled trips for this bus
router.get("/today", c.getTodayTrips);

// Get stops for a specific trip
router.get("/:tripId/stops", c.getTripStops);

// Update trip status (start, ongoing, finished)
router.patch(
  "/:tripId/status",
  body("status")
    .notEmpty().withMessage("Status is required")
    .isIn(["scheduled", "active", "delayed", "completed", "cancelled"])
    .withMessage("Invalid status"),
  c.updateTripStatus
);

module.exports = router;
