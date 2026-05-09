const { Router } = require("express");
const c = require("../controllers/route.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { routeValidation } = require("../middlewares/validate.middleware");

const router = Router();

router.get("/",    c.getAll);
router.get("/:id", c.getById);

router.use(authenticate, authorize("admin"));
router.post("/",           routeValidation.create, c.create);
router.put("/:id",         routeValidation.update, c.update);
router.patch("/:id/suspend", c.suspend);
router.delete("/:id",        c.remove);

module.exports = router;