const { body } = require("express-validator");

const isValidRouteArray = (value) => {
  if (!Array.isArray(value)) {
    throw new Error("subscribedRoutes must be an array of route strings");
  }

  const hasInvalid = value.some((route) => typeof route !== "string" || !route.trim());
  if (hasInvalid) {
    throw new Error("Each subscribed route must be a non-empty string");
  }

  return true;
};

const userValidation = {
  create: [
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("role")
      .notEmpty()
      .withMessage("Role is required")
      .bail()
      .isIn(["admin", "bus"])
      .withMessage("Role must be admin or bus"),
    body("phone").optional().trim(),
    body("subscribedRoutes").optional({ nullable: true }).custom(isValidRouteArray),
  ],
  update: [
    body("firstName").optional().trim().notEmpty().withMessage("First name cannot be empty"),
    body("lastName").optional().trim().notEmpty().withMessage("Last name cannot be empty"),
    body("email").optional().isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("phone").optional().trim(),
    body("subscribedRoutes").optional({ nullable: true }).custom(isValidRouteArray),
    body("role")
      .optional()
      .isIn(["admin", "passenger", "bus"])
      .withMessage("Role must be admin, passenger, or bus"),
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
    body("email").optional().isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("phone").optional().trim(),
    body().custom((value) => {
      if (!value || (!value.email && !value.phone)) {
        throw new Error("Either email or phone is required");
      }

      return true;
    }),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  register: [
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("phone").optional().trim(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("confirmPassword").notEmpty().withMessage("Confirm password is required"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Confirm password does not match password");
      }

      return true;
    }),
  ],
};

const alertValidation = {
  create: [
    body("alertType").trim().notEmpty().withMessage("Alert type is required"),
    body("title").trim().notEmpty().withMessage("Alert title is required"),
    body("description").trim().notEmpty().withMessage("Description is required"),
    body("targetAudience")
      .notEmpty()
      .withMessage("Target audience is required")
      .bail()
      .isIn(["public", "route"])
      .withMessage("Target audience must be public or route"),
    body("targetRoute").optional({ nullable: true }).trim(),
    body("affectedRoute")
      .optional({ nullable: true })
      .trim()
      .custom((value, { req }) => {
        const routeValue = req.body.targetRoute || value;
        if (req.body.targetAudience === "route" && !routeValue) {
          throw new Error("Affected route is required when target audience is route");
        }

        return true;
      }),
    body("affectedBus").optional({ nullable: true }).trim(),
    body("scheduledAt").optional({ nullable: true }).isISO8601().withMessage("Invalid schedule date/time"),
  ],
};

module.exports = { userValidation, newsValidation, authValidation, alertValidation };
