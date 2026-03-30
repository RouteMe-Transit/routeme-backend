
const { body } = require("express-validator");

const userValidation = {
  create: [
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("userName")
      .trim()
      .notEmpty()
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be 3–50 characters"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("role")
      .optional()
      .isIn(["admin", "passenger", "bus"])
      .withMessage("Role must be admin, passenger, or bus"),
    body("gender")
      .optional()
      .isIn(["male", "female", "other"])
      .withMessage("Gender must be male, female, or other"),
    body("dob").optional().isDate().withMessage("Invalid date of birth"),
    body("phone").optional().trim(),
    body("nic").optional().trim(),
  ],
  update: [
    body("firstName").optional().trim().notEmpty().withMessage("First name cannot be empty"),
    body("lastName").optional().trim().notEmpty().withMessage("Last name cannot be empty"),
    body("email").optional().isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("gender")
      .optional()
      .isIn(["male", "female", "other"])
      .withMessage("Gender must be male, female, or other"),
    body("dob").optional().isDate().withMessage("Invalid date of birth"),
  ],
};

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

const authValidation = {
  login: [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  register: [
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("userName")
      .trim()
      .notEmpty()
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be 3–50 characters"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
};

const busValidation = {
  create: [
    body("busNumber").trim().notEmpty().withMessage("Bus number is required"),
    body("licensePlate").trim().notEmpty().withMessage("License plate is required"),
    body("busType")
      .optional()
      .isIn(["A/C Express", "Non A/C", "Semi Luxury", "Luxury", "Mini Bus"])
      .withMessage("Invalid bus type"),
    body("seatingCapacity")
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage("Seating capacity must be a positive integer"),
    body("standingCapacity")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Standing capacity must be a non-negative integer"),
    body("fuelType")
      .optional()
      .isIn(["Diesel", "Petrol", "Electric", "Hybrid"])
      .withMessage("Invalid fuel type"),
    body("shift")
      .optional()
      .isIn(["Morning 5AM", "Morning 9AM", "Afternoon", "Evening", "Night"])
      .withMessage("Invalid shift"),
    body("status")
      .optional()
      .isIn(["Active", "Inactive", "Under Maintenance"])
      .withMessage("Invalid status"),
    body("assignRoute").optional().isInt({ min: 1 }).withMessage("Invalid route ID"),
    body("assignDriver").optional().isInt({ min: 1 }).withMessage("Invalid driver ID"),
    body("serviceDays").optional().isArray().withMessage("serviceDays must be an array"),
    body("revenueLicenseExpiry").optional().isDate().withMessage("Invalid revenue license expiry date"),
    body("insuranceExpiry").optional().isDate().withMessage("Invalid insurance expiry date"),
    body("lastServiceDate").optional().isDate().withMessage("Invalid last service date"),
    body("nextServiceDue").optional().isDate().withMessage("Invalid next service due date"),
    body("year")
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage("Invalid year"),
  ],
  update: [
    body("busNumber").optional().trim().notEmpty().withMessage("Bus number cannot be empty"),
    body("licensePlate").optional().trim().notEmpty().withMessage("License plate cannot be empty"),
    body("busType")
      .optional()
      .isIn(["A/C Express", "Non A/C", "Semi Luxury", "Luxury", "Mini Bus"])
      .withMessage("Invalid bus type"),
    body("seatingCapacity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Seating capacity must be a positive integer"),
    body("standingCapacity")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Standing capacity must be a non-negative integer"),
    body("fuelType")
      .optional()
      .isIn(["Diesel", "Petrol", "Electric", "Hybrid"])
      .withMessage("Invalid fuel type"),
    body("shift")
      .optional()
      .isIn(["Morning 5AM", "Morning 9AM", "Afternoon", "Evening", "Night"])
      .withMessage("Invalid shift"),
    body("status")
      .optional()
      .isIn(["Active", "Inactive", "Under Maintenance"])
      .withMessage("Invalid status"),
    body("assignRoute").optional().isInt({ min: 1 }).withMessage("Invalid route ID"),
    body("assignDriver").optional().isInt({ min: 1 }).withMessage("Invalid driver ID"),
    body("serviceDays").optional().isArray().withMessage("serviceDays must be an array"),
    body("revenueLicenseExpiry").optional().isDate().withMessage("Invalid revenue license expiry date"),
    body("insuranceExpiry").optional().isDate().withMessage("Invalid insurance expiry date"),
    body("lastServiceDate").optional().isDate().withMessage("Invalid last service date"),
    body("nextServiceDue").optional().isDate().withMessage("Invalid next service due date"),
  ],
};

const routeValidation = {
  create: [
    body("routeNumber").trim().notEmpty().withMessage("Route number is required"),
    body("routeName").trim().notEmpty().withMessage("Route name is required"),
    body("routeType")
      .optional()
      .isIn(["Normal", "Express", "Limited Stop", "Night Service"])
      .withMessage("Invalid route type"),
    body("origin").trim().notEmpty().withMessage("Origin is required"),
    body("destination").trim().notEmpty().withMessage("Destination is required"),
    body("distance")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Distance must be a positive number"),
    body("duration")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Duration must be a positive integer (minutes)"),
  ],
  update: [
    body("routeNumber").optional().trim().notEmpty().withMessage("Route number cannot be empty"),
    body("routeName").optional().trim().notEmpty().withMessage("Route name cannot be empty"),
    body("routeType")
      .optional()
      .isIn(["Normal", "Express", "Limited Stop", "Night Service"])
      .withMessage("Invalid route type"),
    body("origin").optional().trim().notEmpty().withMessage("Origin cannot be empty"),
    body("destination").optional().trim().notEmpty().withMessage("Destination cannot be empty"),
    body("distance")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Distance must be a positive number"),
    body("duration")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Duration must be a positive integer (minutes)"),
  ],
};

module.exports = { userValidation, newsValidation, authValidation, busValidation, routeValidation };
