const { Router } = require("express");
const busController = require("../controllers/bus.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { busValidation } = require("../middlewares/validate.middleware");

const router = Router();

router.use(authenticate);

router.get("/", authorize("admin"), busController.getAll);
router.get("/:id", authorize("admin"), busController.getById);
router.post("/", authorize("admin"), busValidation.create, busController.create);
router.put("/:id", authorize("admin"), busValidation.update, busController.update);
router.delete("/:id", authorize("admin"), busController.remove);

module.exports = router;