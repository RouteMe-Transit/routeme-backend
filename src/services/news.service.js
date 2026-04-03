const { News } = require("../models");
const ApiError = require("../utils/ApiError");

const getAllNews = async ({ page = 1, limit = 10, category, publishedOnly = false } = {}) => {
  const offset = (page - 1) * limit;
  const scope = publishedOnly ? "published" : "defaultScope";

  const where = {};
  if (category) where.category = category;

  const { count, rows } = await News.scope(scope).findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["publishedDate", "DESC"]],
  });

  return {
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / limit),
    news: rows,
  };
};

const getNewsById = async (id) => {
  const news = await News.findByPk(id);
  if (!news || news.isDeleted) throw new ApiError(404, "News not found");
  return news;
};

const createNews = async (data) => {
  if (data.isPublished && !data.publishedDate) {
    data.publishedDate = new Date();
  }
  return News.create(data);
};

const updateNews = async (id, data) => {
  const news = await getNewsById(id);

  if (data.isPublished && !news.publishedDate && !data.publishedDate) {
    data.publishedDate = new Date();
  }

  await news.update(data);
  return news;
};

const deleteNews = async (id) => {
  const news = await getNewsById(id);
  await news.update({ isDeleted: true });
};

const publishNews = async (id) => {
  const news = await getNewsById(id);
  await news.update({ isPublished: true, publishedDate: news.publishedDate || new Date() });
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
