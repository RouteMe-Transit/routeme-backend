const { Router } = require("express");
const c = require("../controllers/trip.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { body } = require("express-validator");

const router = Router();

// ─── Validation ───────────────────────────────────────────────────────────────
const tripValidation = [
  body("routeName").trim().notEmpty().withMessage("Route name is required"),
  body("from").trim().notEmpty().withMessage("From location is required"),
  body("to").trim().notEmpty().withMessage("To location is required"),
  body("departure").trim().notEmpty().withMessage("Departure time is required")
    .matches(/^\d{2}:\d{2}$/).withMessage("Departure must be in HH:MM format"),
  body("arrival").trim().notEmpty().withMessage("Arrival time is required")
    .matches(/^\d{2}:\d{2}$/).withMessage("Arrival must be in HH:MM format"),
  body("direction")
    .optional()
    .isIn(["Forward", "Return"])
    .withMessage("Direction must be Forward or Return"),
  body("status")
    .optional()
    .isIn(["Active", "Scheduled", "Delayed", "Completed"])
    .withMessage("Invalid status"),
  body("days").optional().trim(),
  body("busId").optional().trim(),
  body("driverName").optional().trim(),
];

// ─── Public routes ────────────────────────────────────────────────────────────
router.get("/", c.getAll);
router.get("/stats", c.getStats);
router.get("/:id", c.getById);

// ─── Admin only routes ────────────────────────────────────────────────────────
router.use(authenticate, authorize("admin"));
router.post("/", tripValidation, c.create);
router.put("/:id", c.update);
router.delete("/:id", c.remove);

module.exports = router;