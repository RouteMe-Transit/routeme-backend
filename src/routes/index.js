const { Router } = require("express");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const newsRoutes = require("./news.routes");
const alertRoutes = require("./alert.routes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/news", newsRoutes);
router.use("/alerts", alertRoutes);

// ✅ Test API
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working 🎉",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
