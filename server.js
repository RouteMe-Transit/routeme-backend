require("dotenv").config();
const app = require("./src/app");
const { sequelize, syncDatabase } = require("./src/models");
const config = require("./src/config");
const { initAlertScheduler } = require("./src/services/alert.service");

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully");

    await syncDatabase();
    initAlertScheduler();

    app.listen(config.port, () => {
      console.log(`Server running in ${config.env} mode on port ${config.port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

start();
