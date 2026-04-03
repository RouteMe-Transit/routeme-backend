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

module.exports = { userValidation, newsValidation, authValidation };
