const { Router } = require("express");
const c = require("../controllers/route.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

const router = Router();

router.get("/", c.getAll);      // public — passengers need this too
router.get("/:id", c.getById);

router.use(authenticate, authorize("admin"));
router.post("/", c.create);
router.put("/:id", c.update);
router.delete("/:id", c.remove);

module.exports = router;