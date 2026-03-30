const sequelize = require("../config/database");

// Import models
const User = require("./user.model");
const News = require("./news.model");
const Bus = require("./bus.model");
const Route = require("./route.model");

// Associations
Bus.belongsTo(Route, { foreignKey: "assignRoute", as: "route" });
Route.hasMany(Bus, { foreignKey: "assignRoute", as: "buses" });

Bus.belongsTo(User, { foreignKey: "assignDriver", as: "driver" });
User.hasMany(Bus, { foreignKey: "assignDriver", as: "assignedBuses" });

// Sync function
const syncDatabase = async () => {
  await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
  console.log("Database synced successfully");
};

// ✅ EXPORT ONLY ONCE — AT THE END
module.exports = {
  sequelize,
  syncDatabase,
  User,
  News,
  Bus,
  Route,
};
