const { Router } = require("express");
const c = require("../controllers/bus.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authenticate, authorize("admin"));

router.get("/stats", c.getStats);
router.get("/", c.getAll);
router.get("/:id", c.getById);
router.post("/", c.create);
router.put("/:id", c.update);
router.delete("/:id", c.remove);

module.exports = router;