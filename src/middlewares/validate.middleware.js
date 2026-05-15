// validate.middleware.js

const { body } = require("express-validator");

// ── Shared helpers ────────────────────────────────────────────────────────────

const isValidRouteArray = (value) => {
  if (!Array.isArray(value)) throw new Error("subscribedRoutes must be an array of route strings");
  if (value.some((r) => typeof r !== "string" || !r.trim()))
    throw new Error("Each subscribed route must be a non-empty string");
  return true;
};

// ── User validations ──────────────────────────────────────────────────────────

const userValidation = {
  create: [
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("role")
      .notEmpty().withMessage("Role is required")
      .bail()
      .isIn(["admin", "bus"]).withMessage("Role must be admin or bus"),
    body("phone").optional().trim(),
    body("subscribedRoutes").optional({ nullable: true }).custom(isValidRouteArray),
  ],
  update: [
    body("firstName").optional().trim().notEmpty().withMessage("First name cannot be empty"),
    body("lastName").optional().trim().notEmpty().withMessage("Last name cannot be empty"),
    body("email").optional().isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("phone").optional().trim(),
    body("subscribedRoutes").optional({ nullable: true }).custom(isValidRouteArray),
    body("role").optional().isIn(["admin", "passenger", "bus"]).withMessage("Invalid role"),
  ],
  updateSubscriptions: [
    body("subscribedRoutes")
      .exists().withMessage("subscribedRoutes is required")
      .bail()
      .custom(isValidRouteArray),
  ],
};

// ── Bus validations ───────────────────────────────────────────────────────────

const busValidation = {
  create: [
    body("registrationNumber").trim().notEmpty().withMessage("Registration number is required"),
    body("busType")
      .optional()
      .isIn(["A/C Express", "Semi-Luxury", "Regular"])
      .withMessage("Invalid bus type"),
    body("totalSeats").optional().isInt({ min: 1 }).withMessage("Total seats must be a positive integer"),
    body("routeId").optional({ nullable: true }).isInt().withMessage("routeId must be an integer"),
    body("latitude").optional({ nullable: true }).isDecimal().withMessage("Invalid latitude"),
    body("longitude").optional({ nullable: true }).isDecimal().withMessage("Invalid longitude"),
    body("owner.name").trim().notEmpty().withMessage("Owner name is required"),
    body("owner.nic").trim().notEmpty().withMessage("Owner NIC is required"),
    body("owner.email").isEmail().withMessage("Valid owner email is required"),
    body("owner.phone").trim().notEmpty().withMessage("Owner phone is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("drivers").optional().isArray().withMessage("drivers must be an array"),
    body("recordedAt").optional({ nullable: true }).isISO8601().withMessage("Invalid recordedAt date"),
  ],
  update: [
    body("registrationNumber").optional().trim().notEmpty().withMessage("Registration number cannot be empty"),
    body("busType").optional().isIn(["A/C Express", "Semi-Luxury", "Regular"]).withMessage("Invalid bus type"),
    body("totalSeats").optional().isInt({ min: 1 }).withMessage("Total seats must be a positive integer"),
    body("routeId").optional({ nullable: true }).isInt().withMessage("routeId must be an integer"),
    body("latitude").optional({ nullable: true }).isDecimal().withMessage("Invalid latitude"),
    body("longitude").optional({ nullable: true }).isDecimal().withMessage("Invalid longitude"),
    body("owner.name").optional().trim().notEmpty().withMessage("Owner name cannot be empty"),
    body("owner.nic").optional().trim().notEmpty().withMessage("Owner NIC cannot be empty"),
    body("owner.email").optional().isEmail().withMessage("Valid owner email is required"),
    body("owner.phone").optional().trim().notEmpty().withMessage("Owner phone cannot be empty"),
    body("drivers").optional().isArray().withMessage("drivers must be an array"),
    body("recordedAt").optional({ nullable: true }).isISO8601().withMessage("Invalid recordedAt date"),
  ],
};

// ── Route validations ─────────────────────────────────────────────────────────

const routeValidation = {
  create: [
    body("routeName").trim().notEmpty().withMessage("Route name is required"),
    body("from").trim().notEmpty().withMessage("From location is required"),
    body("to").trim().notEmpty().withMessage("To location is required"),
    body("noOfBuses").optional().isInt({ min: 0 }).withMessage("noOfBuses must be a non-negative integer"),
    body("avgTime").optional().trim(),
    body("stopList").optional().isArray().withMessage("stopList must be an array"),
  ],
  update: [
    body("routeName").optional().trim().notEmpty().withMessage("Route name cannot be empty"),
    body("from").optional().trim().notEmpty().withMessage("From location cannot be empty"),
    body("to").optional().trim().notEmpty().withMessage("To location cannot be empty"),
    body("noOfBuses").optional().isInt({ min: 0 }).withMessage("noOfBuses must be a non-negative integer"),
    body("avgTime").optional().trim(),
    body("stopList").optional().isArray().withMessage("stopList must be an array"),
  ],
};

// ── Stop validations ──────────────────────────────────────────────────────────

const stopValidation = {
  create: [
    body("stopName").trim().notEmpty().withMessage("Stop name is required"),
    body("latitude").notEmpty().isDecimal().withMessage("Valid latitude is required"),
    body("longitude").notEmpty().isDecimal().withMessage("Valid longitude is required"),
  ],
  update: [
    body("stopName").optional().trim().notEmpty().withMessage("Stop name cannot be empty"),
    body("latitude").optional().isDecimal().withMessage("Invalid latitude"),
    body("longitude").optional().isDecimal().withMessage("Invalid longitude"),
  ],
};

// ── News validations ──────────────────────────────────────────────────────────

const newsValidation = {
  create: [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("category").trim().notEmpty().withMessage("Category is required"),
    body("content").trim().notEmpty().withMessage("Content is required"),
    body("isPublished").optional().isBoolean().withMessage("isPublished must be a boolean"),
    body("publishedDate").optional().isISO8601().withMessage("Invalid published date"),
    body("image").optional().trim(),
  ],
  update: [
    body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
    body("category").optional().trim().notEmpty().withMessage("Category cannot be empty"),
    body("content").optional().trim().notEmpty().withMessage("Content cannot be empty"),
    body("isPublished").optional().isBoolean().withMessage("isPublished must be a boolean"),
    body("publishedDate").optional().isISO8601().withMessage("Invalid published date"),
  ],
};

// ── Auth validations ──────────────────────────────────────────────────────────

const authValidation = {
  login: [
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),

    body("registrationNumber")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Registration number is required"),

    body().custom((value) => {
      if (
        !value ||
        (!value.email && !value.registrationNumber)
      ) {
        throw new Error(
          "Either email or registration number is required"
        );
      }

      return true;
    }),

    body("password")
      .notEmpty()
      .withMessage("Password is required"),
  ],
  register: [
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("phone").optional().trim(),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("confirmPassword")
      .notEmpty().withMessage("Confirm password is required")
      .custom((value, { req }) => {
        if (value !== req.body.password) throw new Error("Passwords do not match");
        return true;
      }),
  ],
};

// ── Alert validations ─────────────────────────────────────────────────────────

const ALERT_TYPES = [
  // canonical forms (lowercase with spaces)
  'service distruption',
  'road block',
  'delay',
  'accident',
  'breakdown',
  'weather',
  'not operating',
  'heavy rain',
  'damaged roads',
  'rule enforcement',
  'new bus stop',
  'removed bus stop',
  'route change',
  'public events',
  'other',
  // hyphenated forms (from frontend)
  'service-distruption',
  'road-block',
  'not-operating',
  'heavy-rain',
  'damaged-roads',
  'rule-enforcement',
  'new-bus-stop',
  'removed-bus-stop',
  'route-change',
  'public-events',
];

const alertValidation = {
  create: [
    body("alertType")
      .trim().notEmpty().withMessage("Alert type is required")
      .bail()
      .isIn(ALERT_TYPES).withMessage("Invalid alert type"),
    body("title").trim().notEmpty().withMessage("Alert title is required"),
    body("description").optional({ nullable: true }).trim(),
    body("content").optional({ nullable: true }).trim(),
    body("targetAudience").optional({ nullable: true }).isIn(["public", "route"]).withMessage("Target audience must be public or route"),
    body("targetRoute").optional({ nullable: true }).isInt().toInt().withMessage("Target route must be a number"),
    body("affectedRoute")
      .optional({ nullable: true })
      .trim()
      .custom((value, { req }) => {
        const routeValue = req.body.targetRoute || value;
        const targetAudience = req.body.targetAudience || (routeValue ? "route" : "public");
        if (targetAudience === "route" && !routeValue)
          throw new Error("Affected route is required when target audience is route");
        return true;
      }),
    body("affectedBus").optional({ nullable: true }).trim(),
    body("scheduledAt").optional({ nullable: true }).isISO8601().withMessage("Invalid schedule date/time"),
    body().custom((_, { req }) => {
      const routeValue = req.body.targetRoute || req.body.affectedRoute;
      const targetAudience = req.body.targetAudience || (routeValue ? "route" : "public");

      if (targetAudience === "route" && !routeValue) {
        throw new Error("Affected route is required when target audience is route");
      }

      return true;
    }),
  ],
  busSend: [
    body("alertType")
      .trim().notEmpty().withMessage("Alert type is required")
      .bail(),
    body("title").optional({ nullable: true }).trim(),
    body("description").optional({ nullable: true }).trim(),
    body("content").optional({ nullable: true }).trim(),
    body("targetAudience").optional({ nullable: true }).isIn(["public", "route"]).withMessage("Target audience must be public or route"),
    body("targetRoute").optional({ nullable: true }).isInt().toInt().withMessage("Target route must be a number"),
    body("affectedRoute").optional({ nullable: true }).trim(),
    body("affectedBus").optional({ nullable: true }).trim(),
  ],
};

// ── Trip validations ──────────────────────────────────────────────────────────

const TRIP_STATUSES = ["active", "scheduled", "delayed", "completed", "cancelled"];
const VALID_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const isValidDaysArray = (value) => {
  if (!Array.isArray(value)) throw new Error("days must be an array");
  if (value.some((d) => !VALID_DAYS.includes(d)))
    throw new Error(`Each day must be one of: ${VALID_DAYS.join(", ")}`);
  return true;
};

const tripValidation = {
  create: [
    body("routeId")
      .notEmpty().withMessage("routeId is required")
      .bail()
      .isInt({ min: 1 }).withMessage("routeId must be a positive integer"),
    body("busId")
      .notEmpty().withMessage("busId is required")
      .bail()
      .isInt({ min: 1 }).withMessage("busId must be a positive integer"),
    body("direction")
      .optional()
      .isIn(["forward", "return"]).withMessage("direction must be forward or return"),
    body("departureTime")
      .notEmpty().withMessage("departureTime is required")
      .bail()
      .matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage("departureTime must be HH:MM or HH:MM:SS"),
    body("arrivalTime")
      .notEmpty().withMessage("arrivalTime is required")
      .bail()
      .matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage("arrivalTime must be HH:MM or HH:MM:SS"),
    body("days")
      .optional()
      .custom(isValidDaysArray),
    body("status")
      .optional()
      .isIn(TRIP_STATUSES).withMessage(`status must be one of: ${TRIP_STATUSES.join(", ")}`),
  ],
  update: [
    body("routeId").optional().isInt({ min: 1 }).withMessage("routeId must be a positive integer"),
    body("busId").optional().isInt({ min: 1 }).withMessage("busId must be a positive integer"),
    body("direction")
      .optional()
      .isIn(["forward", "return"]).withMessage("direction must be forward or return"),
    body("departureTime")
      .optional()
      .matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage("departureTime must be HH:MM or HH:MM:SS"),
    body("arrivalTime")
      .optional()
      .matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage("arrivalTime must be HH:MM or HH:MM:SS"),
    body("days")
      .optional()
      .custom(isValidDaysArray),
    body("status")
      .optional()
      .isIn(TRIP_STATUSES).withMessage(`status must be one of: ${TRIP_STATUSES.join(", ")}`),
  ],
  updateStatus: [
    body("status")
      .notEmpty().withMessage("status is required")
      .bail()
      .isIn(TRIP_STATUSES).withMessage(`status must be one of: ${TRIP_STATUSES.join(", ")}`),
  ],
};

const complaintValidation = {
  create: [
    body("category").trim().notEmpty().withMessage("Category is required"),
    body("busNumber").trim().notEmpty().withMessage("Bus number is required"),
    body("description").trim().notEmpty().withMessage("Description is required"),
  ],
  updateStatus: [
    body("status")
      .isIn(["Pending", "Resolved"])
      .withMessage("Status must be Pending or Resolved"),
  ],
};

const feedbackValidation = {
  create: [
    body("category").trim().notEmpty().withMessage("Category is required"),
    body("busNumber").trim().notEmpty().withMessage("Bus number is required"),
    body("message").trim().notEmpty().withMessage("Message is required"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  ],
};

module.exports = {
  userValidation,
  busValidation,
  routeValidation,
  stopValidation,
  newsValidation,
  authValidation,
  alertValidation,
  tripValidation,
  complaintValidation,
  feedbackValidation,
};