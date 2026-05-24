const { Op, where, literal } = require("sequelize");
const { Trip } = require("../models");

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const resetDailyTrips = async () => {
  try {
    const todayDay = days[new Date().getDay()];

    const [updated] = await Trip.update(
      { status: "scheduled" },
      {
        where: {
          status: "completed",
          [Op.and]: where(literal(`JSON_CONTAINS(days, '"${todayDay}"')`), true),
        },
      }
    );

    if (updated > 0) {
      console.log(`✅ Daily trip reset: ${updated} trip(s) set to scheduled for ${todayDay}`);
    }
  } catch (err) {
    console.error("Daily trip reset failed:", err.message);
  }
};

const msToNextMidnight = () => {
  const now = new Date();
  const next = new Date(now);
  next.setDate(now.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next - now;
};

const initDailyTripReset = () => {
  // Run once at startup (for immediate correction if needed)
  resetDailyTrips();

  // Schedule at next midnight then every 24h
  setTimeout(() => {
    resetDailyTrips();
    setInterval(resetDailyTrips, 24 * 60 * 60 * 1000);
  }, msToNextMidnight());

  console.log("✅ Daily trip reset scheduler initialized");
};

module.exports = { initDailyTripReset, resetDailyTrips };
