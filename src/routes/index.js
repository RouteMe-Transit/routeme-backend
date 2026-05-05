const { Router } = require("express");
const authRoutes  = require("./auth.routes");
const userRoutes  = require("./user.routes");
const newsRoutes  = require("./news.routes");
const alertRoutes = require("./alert.routes");
const busRoutes   = require("./bus.routes");
const busTripRoutes = require("./bus-trip.routes");
const routeRoutes = require("./route.routes");
const stopRoutes  = require("./stop.routes");
const tripRoutes  = require("./trip.routes");

const router = Router();

router.use("/auth",        authRoutes);
router.use("/users",       userRoutes);
router.use("/news",        newsRoutes);
router.use("/alerts",      alertRoutes);
router.use("/buses",       busRoutes);
router.use("/bus-trips",   busTripRoutes);
router.use("/routes",      routeRoutes);
router.use("/stops",       stopRoutes);
router.use("/trips",       tripRoutes);

router.get("/test", (req, res) =>
  res.json({ success: true, message: "API is working 🎉", timestamp: new Date().toISOString() })
);

module.exports = router;