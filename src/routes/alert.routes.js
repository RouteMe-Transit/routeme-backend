const { Router } = require("express");
const alertController = require("../controllers/alert.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { alertValidation } = require("../middlewares/validate.middleware");

const router = Router();

router.use(authenticate, authorize("admin"));

router.post("/", alertValidation.create, alertController.create);
router.get("/history", alertController.getHistory);
router.get("/:id", alertController.getById);

module.exports = router;
