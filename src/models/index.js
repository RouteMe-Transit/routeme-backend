// models/index.js  — add Trip to existing file
const sequelize = require("../config/database");
const User = require("./user.model");
const News = require("./news.model");
const Alert = require("./alerts.model");
const BusDetails = require("./bus_details.model");
const Route = require("./route.model");
const Stop = require("./stop.model");
const Trip = require("./trip.model");       // ← NEW

// Associations
User.hasOne(BusDetails, { foreignKey: "userId", as: "busDetails" });
BusDetails.belongsTo(User, { foreignKey: "userId", as: "user" });

const syncDatabase = async () => {
  await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
  console.log("Database synced successfully");
};

module.exports = { sequelize, syncDatabase, User, News, Alert, BusDetails, Route, Stop, Trip };  // ← add Trip