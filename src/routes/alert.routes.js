const { Router } = require("express");
const alertController = require("../controllers/alert.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { alertValidation } = require("../middlewares/validate.middleware");

const router = Router();

router.use(authenticate);

router.post("/bus/send", authorize("bus"), alertValidation.busSend, alertController.sendBusAlert);// Bus users can send alerts related to their assigned route
router.get("/bus/history", authorize("bus"), alertController.getBusHistory); // Bus users can view their own sent alerts history
router.get("/feed", authorize("passenger"), alertController.getPassengerFeed); // Passengers can view public and subscribed-route alerts

router.post("/", authorize("admin"), alertValidation.create, alertController.create); // Admins can create alerts for any route or public alerts
router.get("/history", authorize("admin"), alertController.getHistory); // Admins can view admin-created alert history
router.get("/history/all", authorize("admin"), alertController.getAllHistory); // Admins can view complete alert history (admin + bus)
router.get("/:id", authorize("admin"), alertController.getById);// Admins can view details of any alert by ID

module.exports = router;
