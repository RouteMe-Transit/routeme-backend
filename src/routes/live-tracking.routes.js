const { Router } = require("express");
const c = require("../controllers/live-tracking.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { liveTrackingValidation } = require("../middlewares/validate.middleware");

const router = Router();

router.post(
  "/location",
  authenticate,
  authorize("bus"),
  liveTrackingValidation.uploadLocation,
  c.uploadLocation
);

router.get("/nearby", authenticate, c.getNearbyBuses);
router.get("/route", authenticate, c.getBusesByRoute);

module.exports = router;
