const sequelize  = require("../config/database");
const User       = require("./user.model");
const News       = require("./news.model");
const Alert      = require("./alerts.model");
const BusDetails = require("./bus_details.model");
const Route      = require("./route.model");
const Stop       = require("./stop.model");
const RouteStop  = require("./route_stops.model");

// ── User ↔ BusDetails (one-to-one via userId)
User.hasOne(BusDetails,    { foreignKey: "userId", as: "busDetails" });
BusDetails.belongsTo(User, { foreignKey: "userId", as: "user" });

// ── Route ↔ BusDetails (one-to-many via routeId)
Route.hasMany(BusDetails,     { foreignKey: "routeId", as: "buses" });
BusDetails.belongsTo(Route,   { foreignKey: "routeId", as: "route" });

// ── Route ↔ RouteStop (one-to-many) and RouteStop ↔ Stop (many-to-one)
Route.hasMany(RouteStop, { foreignKey: "routeId", as: "routeStops" });
RouteStop.belongsTo(Route, { foreignKey: "routeId", as: "route" });
RouteStop.belongsTo(Stop,  { foreignKey: "stopId",  as: "stop" });
Stop.hasMany(RouteStop,   { foreignKey: "stopId",  as: "routeStops" });

const syncDatabase = async () => {
  await sequelize.sync({ alter: true });
  console.log("✅ Database synced successfully");
};

module.exports = { sequelize, syncDatabase, User, News, Alert, BusDetails, Route, Stop, RouteStop };