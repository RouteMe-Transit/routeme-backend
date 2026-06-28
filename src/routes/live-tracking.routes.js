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
);//this route will be used by the bus to upload its location to the server

router.get("/nearby", authenticate, c.getNearbyBuses);//this route will return the buses that are near the user
router.get("/route", authenticate, c.getBusesByRoute);//this route will return the buses that are on the same route as the user
router.get(
  "/all",
  authenticate,
  authorize("admin"),
  c.getAllBuses
);//this route will return all the buses with their last known location, this is for admin use only

module.exports = router;
