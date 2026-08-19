const { Router } = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const lostFoundController = require("../controllers/lost_found.controller");
const { authenticate, optionalAuthenticate } = require("../middlewares/auth.middleware");
const { lostFoundValidation } = require("../middlewares/validate.middleware");

// ── Ensure upload directory exists at startup ─────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, "../../public/uploads/lost-found");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log("📁 Created upload directory:", UPLOAD_DIR);
}

// ── Multer storage ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `lost-${unique}${ext}`);
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

// Stats
router.get("/stats/weekly", lostFoundController.getWeeklyCount);

// Authenticated user's items
router.get("/my-items", authenticate, lostFoundController.getMyItems);

// All items (public / passenger)
router.get("/", lostFoundController.getAll);

// Single item
router.get("/:id", lostFoundController.getById);

// Create item (supports logged-in users & guest passengers)
router.post(
  "/",
  optionalAuthenticate,
  upload.single("image"),
  lostFoundValidation.create,
  lostFoundController.create
);

// Update item
router.put(
  "/:id",
  authenticate,
  upload.single("image"),
  lostFoundValidation.update,
  lostFoundController.update
);

// Update status
router.patch(
  "/:id/status",
  authenticate,
  lostFoundValidation.updateStatus,
  lostFoundController.updateStatus
);

// Delete item
router.delete("/:id", authenticate, lostFoundController.remove);

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
