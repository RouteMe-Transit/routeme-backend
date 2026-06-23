const { Router } = require("express");
const path   = require("path");
const fs     = require("fs");
const multer = require("multer");

const newsController            = require("../controllers/news.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { newsValidation }        = require("../middlewares/validate.middleware");

// ── Ensure upload directory exists at startup ─────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, "../../public/uploads/news");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log("📁 Created upload directory:", UPLOAD_DIR);
}

// ── Multer storage ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext    = path.extname(file.originalname).toLowerCase();
    cb(null, `news-${unique}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ── Router ────────────────────────────────────────────────────────────────────
const router = Router();

// Public
router.get("/",    newsController.getAll);
router.get("/:id", newsController.getById);

// Admin — multer must run BEFORE validation so req.file is available
router.post(
  "/",
  authenticate,
  authorize("admin"),
  upload.single("image"),
  newsValidation.create,
  newsController.create,
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  upload.single("image"),
  newsValidation.update,
  newsController.update,
);

router.delete("/:id",          authenticate, authorize("admin"), newsController.remove);
router.patch("/:id/publish",   authenticate, authorize("admin"), newsController.publish);
router.patch("/:id/unpublish", authenticate, authorize("admin"), newsController.unpublish);

// ── Multer error handler ──────────────────────────────────────────────────────
router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ success: false, message: "Image must be under 5 MB" });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err?.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

module.exports = router;