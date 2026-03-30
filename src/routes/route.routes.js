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

module.exports = router;