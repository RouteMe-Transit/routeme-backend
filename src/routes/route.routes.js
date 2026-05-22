<<<<<<< HEAD
const { Router } = require("express");
const routeController = require("../controllers/route.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { routeValidation } = require("../middlewares/validate.middleware");

const router = Router();

router.use(authenticate);

router.get("/", authorize("admin"), routeController.getAll);
router.get("/:id", authorize("admin"), routeController.getById);
router.post("/", authorize("admin"), routeValidation.create, routeController.create);
router.put("/:id", authorize("admin"), routeValidation.update, routeController.update);
router.delete("/:id", authorize("admin"), routeController.remove);

=======
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

>>>>>>> f0ab595431ff891989485c94bb5c10ae7be63db7
module.exports = router;