const { Router } = require("express");
const userController = require("../controllers/user.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { userValidation } = require("../middlewares/validate.middleware");

const router = Router();

router.use(authenticate);

router.get("/", authorize("admin"), userController.getAll);
router.get("/:id", authorize("admin"), userController.getById);
router.post("/", authorize("admin"), userValidation.create, userController.create);
router.put("/:id", authorize("admin"), userValidation.update, userController.update);
router.delete("/:id", authorize("admin"), userController.remove);

module.exports = router;
