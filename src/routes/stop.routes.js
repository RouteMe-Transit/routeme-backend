const { Router } = require("express");
const c = require("../controllers/stop.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { stopValidation } = require("../middlewares/validate.middleware");

const router = Router();

// /stats MUST come before /:id or Express will treat "stats" as an id
router.get("/stats", c.getStats);
router.get("/",      c.getAll);
router.get("/:id",   c.getById);

router.use(authenticate, authorize("admin"));
router.post("/",            stopValidation.create, c.create);
router.put("/:id",          stopValidation.update, c.update);
router.patch("/:id/toggle", c.toggleActive);

module.exports = router;