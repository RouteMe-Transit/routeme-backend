const { Router } = require("express");
const c = require("../controllers/stop.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

const router = Router();

router.get("/", c.getAll);      // public
router.get("/:id", c.getById);

router.use(authenticate, authorize("admin"));
router.post("/", c.create);
router.put("/:id", c.update);
router.patch("/:id/toggle", c.toggleActive);
router.delete("/:id", c.remove);

module.exports = router;