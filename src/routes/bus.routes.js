const { Router } = require("express");
const c = require("../controllers/bus.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { busValidation } = require("../middlewares/validate.middleware");

const router = Router();
router.use(authenticate, authorize("admin"));

router.get("/stats",       c.getStats);
router.get("/",            c.getAll);
router.get("/:id",         c.getById);
router.post("/",           busValidation.create, c.create);
router.put("/:id",         busValidation.update, c.update);
router.patch("/:id/toggle", c.toggleActive);   // suspend / unsuspend

module.exports = router;