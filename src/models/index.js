const sequelize = require("../config/database");
const User = require("./user.model");
const News = require("./news.model");
const Complaint = require("./complaint.model");

// Define associations here as the app grows
// e.g. User.hasMany(News, { foreignKey: 'authorId' });
User.hasMany(Complaint, { foreignKey: "userId" });
Complaint.belongsTo(User, { foreignKey: "userId" });

const syncDatabase = async () => {
  await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
  console.log("Database synced successfully");
};

module.exports = { sequelize, syncDatabase, User, News, Complaint };
