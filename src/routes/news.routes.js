const { Router } = require("express");
const newsController = require("../controllers/news.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { newsValidation } = require("../middlewares/validate.middleware");

const router = Router();

// Public routes
router.get("/", newsController.getAll);
router.get("/:id", newsController.getById);

// Protected routes (admin only)
router.post("/", authenticate, authorize("admin"), newsValidation.create, newsController.create);
router.put("/:id", authenticate, authorize("admin"), newsValidation.update, newsController.update);
router.delete("/:id", authenticate, authorize("admin"), newsController.remove);
router.patch("/:id/publish", authenticate, authorize("admin"), newsController.publish);
router.patch("/:id/unpublish", authenticate, authorize("admin"), newsController.unpublish);

module.exports = router;
