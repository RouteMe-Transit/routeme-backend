
const { Router } = require("express");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const newsRoutes = require("./news.routes");
const busRoutes = require("./bus.routes");
const routeRoutes = require("./route.routes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/news", newsRoutes);
router.use("/buses", busRoutes);
router.use("/routes", routeRoutes);

module.exports = router;
