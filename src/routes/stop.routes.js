const { Router } = require("express");
const c = require("../controllers/stop.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { stopValidation } = require("../middlewares/validate.middleware");

const router = Router();

// Public routes
router.get("/stats", c.getStats);   // ← must be BEFORE /:id or it gets swallowed
router.get("/",      c.getAll);
router.get("/:id",   c.getById);

// Admin-only routes
router.use(authenticate, authorize("admin"));
router.post("/",            stopValidation.create, c.create);
router.put("/:id",          stopValidation.update, c.update);
router.patch("/:id/toggle", c.toggleActive);

module.exports = router;