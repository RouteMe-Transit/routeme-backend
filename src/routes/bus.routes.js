<<<<<<< HEAD
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

=======
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

>>>>>>> f0ab595431ff891989485c94bb5c10ae7be63db7
module.exports = router;