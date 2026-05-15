const path = require("path");
const fs   = require("fs");

const { News } = require("../models");
const ApiError = require("../utils/ApiError");

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build the public URL path from a multer file object.
 * e.g. req.file → "/uploads/news/news-1234567890-123456.jpg"
 * This path is stored in the DB and served by express.static.
 */
const getImageUrl = (file) => {
  if (!file) return undefined;
  return "/uploads/news/" + path.basename(file.path);
};

/**
 * Delete an image file from disk.
 * Silently ignores missing files.
 */
const deleteImageFile = (imageUrl) => {
  if (!imageUrl) return;
  try {
    // imageUrl is like "/uploads/news/news-xxx.jpg"
    // The actual file is at <project_root>/public/uploads/news/news-xxx.jpg
    const filePath = path.join(__dirname, "../../public", imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("[news.service] Deleted image:", filePath);
    }
  } catch (err) {
    console.warn("[news.service] Could not delete image file:", imageUrl, err.message);
  }
};

// ── Service functions ─────────────────────────────────────────────────────────

const getAllNews = async ({
  page         = 1,
  limit        = 10,
  category,
  publishedOnly = false,
} = {}) => {
  const offset = (Number(page) - 1) * Number(limit);

  const scope = publishedOnly === "true" || publishedOnly === true
    ? "published"
    : "defaultScope";

  const where = {};
  if (category) where.category = category;

  const { count, rows } = await News.scope(scope).findAndCountAll({
    where,
    limit:  parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order:  [["publishedDate", "DESC"], ["createdAt", "DESC"]],
  });

  return {
    total:      count,
    page:       parseInt(page, 10),
    totalPages: Math.ceil(count / limit),
    news:       rows,
  };
};

const getNewsById = async (id) => {
  const news = await News.findByPk(id);
  if (!news || news.isDeleted) throw new ApiError(404, "News not found");
  return news;
};

const createNews = async (data, file) => {
  // Attach saved image URL when a file was uploaded
  if (file) {
    data.image = getImageUrl(file);
  }

  // Normalise isPublished string → boolean (FormData sends strings)
  if (typeof data.isPublished === "string") {
    data.isPublished = data.isPublished === "true";
  }

  // Auto-set publishedDate when publishing immediately
  if (data.isPublished && !data.publishedDate) {
    data.publishedDate = new Date();
  }

  return News.create(data);
};

const updateNews = async (id, data, file) => {
  const news = await getNewsById(id);

  // Replace image: delete old file, store new URL
  if (file) {
    deleteImageFile(news.image);
    data.image = getImageUrl(file);
  }

  // Normalise isPublished
  if (typeof data.isPublished === "string") {
    data.isPublished = data.isPublished === "true";
  }

  // Auto-set publishedDate when promoting a draft
  if (data.isPublished && !news.publishedDate && !data.publishedDate) {
    data.publishedDate = new Date();
  }

  await news.update(data);
  return news;
};

const deleteNews = async (id) => {
  const news = await getNewsById(id);
  // Soft-delete — image kept on disk for recovery
  await news.update({ isDeleted: true });
};

const publishNews = async (id) => {
  const news = await getNewsById(id);
  await news.update({
    isPublished:   true,
    publishedDate: news.publishedDate || new Date(),
  });
  return news;
};

const unpublishNews = async (id) => {
  const news = await getNewsById(id);
  await news.update({ isPublished: false });
  return news;
};

module.exports = {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  publishNews,
  unpublishNews,
};