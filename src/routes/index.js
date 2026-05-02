const { Router } = require("express");
const authRoutes  = require("./auth.routes");
const userRoutes  = require("./user.routes");
const newsRoutes  = require("./news.routes");
const alertRoutes = require("./alert.routes");
const busRoutes   = require("./bus.routes");     // NEW
const routeRoutes = require("./route.routes");   // NEW
const stopRoutes  = require("./stop.routes");    // NEW

const router = Router();

router.use("/auth",   authRoutes);
router.use("/users",  userRoutes);
router.use("/news",   newsRoutes);
router.use("/alerts", alertRoutes);
router.use("/buses",  busRoutes);    // NEW
router.use("/routes", routeRoutes);  // NEW
router.use("/stops",  stopRoutes);   // NEW

router.get("/test", (req, res) =>
  res.json({ success: true, message: "API is working 🎉", timestamp: new Date().toISOString() })
);

module.exports = router;