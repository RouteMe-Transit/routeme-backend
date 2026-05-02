const sequelize  = require("../config/database");
const User       = require("./user.model");
const News       = require("./news.model");
const Alert      = require("./alerts.model");
const BusDetails = require("./bus_details.model");
const Route      = require("./route.model");
const Stop       = require("./stop.model");

// ── ONE association only, both sides use the SAME foreignKey "userId"
// ── This prevents Sequelize from auto-generating an "ownerId" column
User.hasOne(BusDetails,    { foreignKey: "userId", as: "busDetails" });
BusDetails.belongsTo(User, { foreignKey: "userId", as: "user" });

// ── Use alter:true so existing data is preserved but schema stays in sync
// ── Switch to force:true ONLY if you want a clean wipe
const syncDatabase = async () => {
  await sequelize.sync({ alter: true });
  console.log("✅ Database synced successfully");
};

module.exports = { sequelize, syncDatabase, User, News, Alert, BusDetails, Route, Stop };