const sequelize  = require("../config/database");
const User       = require("./user.model");
const News       = require("./news.model");
const Alert      = require("./alerts.model");
const BusDetails = require("./bus_details.model");
const Route      = require("./route.model");
const Stop       = require("./stop.model");

// ── User ↔ BusDetails (one-to-one via userId)
User.hasOne(BusDetails,    { foreignKey: "userId", as: "busDetails" });
BusDetails.belongsTo(User, { foreignKey: "userId", as: "user" });

// ── Route ↔ BusDetails (one-to-many via routeId)
Route.hasMany(BusDetails,     { foreignKey: "routeId", as: "buses" });
BusDetails.belongsTo(Route,   { foreignKey: "routeId", as: "route" });

const syncDatabase = async () => {
  await sequelize.sync({ alter: true });
  console.log("✅ Database synced successfully");
};

module.exports = { sequelize, syncDatabase, User, News, Alert, BusDetails, Route, Stop };