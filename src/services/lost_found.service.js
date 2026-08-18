const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");
const { LostFound, User } = require("../models");
const ApiError = require("../utils/ApiError");

// ── Helpers ───────────────────────────────────────────────────────────────────

const getImageUrl = (file) => {
  if (!file) return undefined;
  return "/uploads/lost-found/" + path.basename(file.path);
};

const deleteImageFile = (imageUrl) => {
  if (!imageUrl) return;
  try {
    const filePath = path.join(__dirname, "../../public", imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("[lost_found.service] Deleted image:", filePath);
    }
  } catch (err) {
    console.warn("[lost_found.service] Could not delete image file:", imageUrl, err.message);
  }
};

const USER_ATTRIBUTES = ["id", "firstName", "lastName", "phone", "email"];

// ── Service Functions ─────────────────────────────────────────────────────────

const getAllLostFound = async ({
  page = 1,
  limit = 20,
  itemType,
  status,
  search,
} = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const offset = (pageNum - 1) * limitNum;

  const where = { isDeleted: false };

  if (itemType && ["lost", "found"].includes(itemType.toLowerCase())) {
    where.itemType = itemType.toLowerCase();
  }

  if (status) {
    where.status = status;
  }

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    where[Op.or] = [
      { itemName: { [Op.like]: q } },
      { description: { [Op.like]: q } },
      { location: { [Op.like]: q } },
      { busNumber: { [Op.like]: q } },
    ];
  }

  const { count, rows } = await LostFound.findAndCountAll({
    where,
    limit: limitNum,
    offset,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: User,
        as: "user",
        attributes: USER_ATTRIBUTES,
      },
    ],
  });

  return {
    total: count,
    page: pageNum,
    totalPages: Math.ceil(count / limitNum),
    items: rows,
  };
};

const getMyItems = async (userId, {
  page = 1,
  limit = 20,
  itemType,
  status,
  search,
} = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const offset = (pageNum - 1) * limitNum;

  const where = {
    userId,
    isDeleted: false,
  };

  if (itemType && ["lost", "found"].includes(itemType.toLowerCase())) {
    where.itemType = itemType.toLowerCase();
  }

  if (status) {
    where.status = status;
  }

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    where[Op.or] = [
      { itemName: { [Op.like]: q } },
      { description: { [Op.like]: q } },
      { location: { [Op.like]: q } },
      { busNumber: { [Op.like]: q } },
    ];
  }

  const { count, rows } = await LostFound.findAndCountAll({
    where,
    limit: limitNum,
    offset,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: User,
        as: "user",
        attributes: USER_ATTRIBUTES,
      },
    ],
  });

  return {
    total: count,
    page: pageNum,
    totalPages: Math.ceil(count / limitNum),
    items: rows,
  };
};

const getLostFoundById = async (id) => {
  const item = await LostFound.findOne({
    where: { id, isDeleted: false },
    include: [
      {
        model: User,
        as: "user",
        attributes: USER_ATTRIBUTES,
      },
    ],
  });

  if (!item) {
    throw new ApiError(404, "Lost & Found item not found");
  }

  return item;
};

const createLostFound = async (data, file, userId) => {
  const payload = {
    itemName: data.name || data.itemName,
    busNumber: data.busNumber,
    date: data.date,
    time: data.time || null,
    location: data.location,
    description: data.description,
    itemType: (data.itemType || data.type || "lost").toLowerCase(),
    contactPhone: data.contactPhone || null,
    contactEmail: data.contactEmail || null,
    status: data.status || "open",
    userId: userId || null,
  };

  if (file) {
    payload.image = getImageUrl(file);
  }

  const created = await LostFound.create(payload);
  return getLostFoundById(created.id);
};

const updateLostFound = async (id, data, file, userId, userRole) => {
  const item = await getLostFoundById(id);

  if (item.userId && item.userId !== userId && userRole !== "admin") {
    throw new ApiError(403, "You do not have permission to update this item");
  }

  const updates = {};
  if (data.name !== undefined || data.itemName !== undefined) {
    updates.itemName = data.name || data.itemName;
  }
  if (data.busNumber !== undefined) updates.busNumber = data.busNumber;
  if (data.date !== undefined) updates.date = data.date;
  if (data.time !== undefined) updates.time = data.time;
  if (data.location !== undefined) updates.location = data.location;
  if (data.description !== undefined) updates.description = data.description;
  if (data.itemType !== undefined || data.type !== undefined) {
    updates.itemType = (data.itemType || data.type).toLowerCase();
  }
  if (data.status !== undefined) updates.status = data.status;
  if (data.contactPhone !== undefined) updates.contactPhone = data.contactPhone;
  if (data.contactEmail !== undefined) updates.contactEmail = data.contactEmail;

  if (file) {
    if (item.image) deleteImageFile(item.image);
    updates.image = getImageUrl(file);
  }

  await item.update(updates);
  return getLostFoundById(id);
};

const deleteLostFound = async (id, userId, userRole) => {
  const item = await getLostFoundById(id);

  if (item.userId && item.userId !== userId && userRole !== "admin") {
    throw new ApiError(403, "You do not have permission to delete this item");
  }

  await item.update({ isDeleted: true });
  return true;
};

const updateStatus = async (id, status, userId, userRole) => {
  const item = await getLostFoundById(id);

  if (item.userId && item.userId !== userId && userRole !== "admin") {
    throw new ApiError(403, "You do not have permission to modify this item");
  }

  await item.update({ status });
  return getLostFoundById(id);
};

const getWeeklyReportsCount = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const count = await LostFound.count({
    where: {
      isDeleted: false,
      createdAt: {
        [Op.gte]: sevenDaysAgo,
      },
    },
  });

  return { weeklyCount: count };
};

module.exports = {
  getAllLostFound,
  getMyItems,
  getLostFoundById,
  createLostFound,
  updateLostFound,
  deleteLostFound,
  updateStatus,
  getWeeklyReportsCount,
};
