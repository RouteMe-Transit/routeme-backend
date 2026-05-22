const { Router } = require("express");
const c = require("../controllers/trip.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { tripValidation } = require("../middlewares/validate.middleware");

const router = Router();
router.use(authenticate, authorize("admin"));

router.get("/stats",         c.getStats);
router.get("/",              c.getAll);
router.get("/:id",           c.getById);
router.post("/",             tripValidation.create,       c.create);
router.put("/:id",           tripValidation.update,       c.update);
router.patch("/:id/status",  tripValidation.updateStatus, c.updateStatus);
router.delete("/:id",        c.remove);

module.exports = router;