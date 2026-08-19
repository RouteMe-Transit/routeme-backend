const sequelize  = require("../config/database");

const User       = require("./user.model");
const News       = require("./news.model");
const Alert      = require("./alerts.model");
const BusDetails = require("./bus_details.model");
const BusLiveLocation = require("./bus_live_location.model");
const FavoriteRoute = require("./favorite-route.model");
const Route      = require("./route.model");
const Stop       = require("./stop.model");
const RouteStop  = require("./route_stops.model");
const Trip       = require("./trip.model");
const Complaint  = require("./complaint.model");
const Feedback   = require("./feedback.model");
const OTP        = require("./otpmodel");
const Report     = require("./report.model");
const LostFound  = require("./lost_found.model");

// ── User ↔ LostFound (one-to-many)
User.hasMany(LostFound, { foreignKey: "userId", as: "lostFoundItems" });
LostFound.belongsTo(User, { foreignKey: "userId", as: "user" });

// ── User ↔ BusDetails (one-to-one via userId)
User.hasOne(BusDetails,    { foreignKey: "userId", as: "busDetails" });
BusDetails.belongsTo(User, { foreignKey: "userId", as: "user" });

// ── User ↔ Complaint (one-to-many)
User.hasMany(Complaint, { foreignKey: "userId", as: "complaints" });
Complaint.belongsTo(User, { foreignKey: "userId", as: "user" });

// ── User ↔ Report (one-to-many)
User.hasMany(Report, { foreignKey: "userId", as: "reports" });
Report.belongsTo(User, { foreignKey: "userId", as: "user" });

// ── User ↔ Feedback (one-to-many)
User.hasMany(Feedback, { foreignKey: "userId", as: "feedbacks" });
Feedback.belongsTo(User, { foreignKey: "userId", as: "user" });

// ── User ↔ FavoriteRoute (one-to-many)
User.hasMany(FavoriteRoute, { foreignKey: "userId", as: "favoriteRouteLinks" });
FavoriteRoute.belongsTo(User, { foreignKey: "userId", as: "user" });

// ── Route ↔ FavoriteRoute (one-to-many)
Route.hasMany(FavoriteRoute, { foreignKey: "routeId", as: "favoriteRouteLinks" });
FavoriteRoute.belongsTo(Route, { foreignKey: "routeId", as: "route" });

// ── Route ↔ BusDetails (one-to-many via routeId)
Route.hasMany(BusDetails,   { foreignKey: "routeId", as: "buses" });
BusDetails.belongsTo(Route, { foreignKey: "routeId", as: "route" });

// ── BusDetails/Route ↔ BusLiveLocation
BusDetails.hasMany(BusLiveLocation,      { foreignKey: "busId", as: "liveLocations" });
BusLiveLocation.belongsTo(BusDetails,    { foreignKey: "busId", as: "bus" });

Route.hasMany(BusLiveLocation,           { foreignKey: "routeId", as: "liveLocations" });
BusLiveLocation.belongsTo(Route,         { foreignKey: "routeId", as: "route" });

// ── Route ↔ RouteStop (one-to-many) and RouteStop ↔ Stop (many-to-one)
Route.hasMany(RouteStop,   { foreignKey: "routeId", as: "routeStops" });
RouteStop.belongsTo(Route, { foreignKey: "routeId", as: "route" });

RouteStop.belongsTo(Stop,  { foreignKey: "stopId", as: "stop" });
Stop.hasMany(RouteStop,    { foreignKey: "stopId", as: "routeStops" });

// ── Trip associations
Route.hasMany(Trip,        { foreignKey: "routeId", as: "trips" });
Trip.belongsTo(Route,      { foreignKey: "routeId", as: "route" });

BusDetails.hasMany(Trip,   { foreignKey: "busId", as: "trips" });
Trip.belongsTo(BusDetails, { foreignKey: "busId", as: "bus" });

// ── Sync DB
const syncDatabase = async () => {
  await sequelize.sync();

  const legacyUsers = await User.findAll({
    where: { role: "passenger" },
    attributes: ["id", "favoriteRoutes"],
  });

  const legacyRouteRows = [];
  const seen = new Set();
  const now = new Date();

  for (const user of legacyUsers) {
    const routeIds = Array.isArray(user.favoriteRoutes) ? user.favoriteRoutes : [];

    for (const routeIdValue of routeIds) {
      const routeId = Number(routeIdValue);
      if (!Number.isInteger(routeId) || routeId <= 0) continue;

      const key = `${user.id}:${routeId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      legacyRouteRows.push({
        userId: user.id,
        routeId,
        addedAt: now,
      });
    }
  }

  if (legacyRouteRows.length) {
    await FavoriteRoute.bulkCreate(legacyRouteRows, { ignoreDuplicates: true });
  }

  console.log("✅ Database synced successfully");
};

module.exports = {
  sequelize,
  syncDatabase,
  User,
  News,
  Alert,
  BusDetails,
  BusLiveLocation,
  FavoriteRoute,
  Route,
  Stop,
  RouteStop,
  Trip,
  Complaint,
  Feedback,
  Report,
  OTP,
  LostFound,
};