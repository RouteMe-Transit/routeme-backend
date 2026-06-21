const { Router } = require("express");
const userController = require("../controllers/user.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { userValidation } = require("../middlewares/validate.middleware");

const router = Router();

router.use(authenticate);

router.get("/", authorize("admin"), userController.getAll);
router.get("/:id", authorize("admin"), userController.getById);
router.post("/", authorize("admin"), userValidation.create, userController.create);
router.put("/me/subscriptions", authorize("passenger"), userValidation.updateSubscriptions, userController.updateMySubscriptions);// Passengers can update their own subscribed routes
router.get("/me/favorite-routes", authorize("passenger"), userController.getMyFavoriteRoutes);
router.post("/me/favorite-routes", authorize("passenger"), userValidation.favoriteRoute, userController.addMyFavoriteRoute);
router.delete("/me/favorite-routes/:routeId", authorize("passenger"), userController.removeMyFavoriteRoute);
router.put("/:id", authorize("admin"), userValidation.update, userController.update); 
router.delete("/:id", authorize("admin"), userController.remove);

module.exports = router;