require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const app = require("./src/app");
const { sequelize, syncDatabase } = require("./src/models");
const config = require("./src/config");
const { initAlertScheduler } = require("./src/services/alert.service");
const { initDailyTripReset } = require("./src/services/scheduler.service");
const { setSocketIO, toRoomKey } = require("./src/services/websocket.service");

const PORT = config.port || 5000;

const start = async () => {
  try {
    console.log("⏳ Starting server...");

    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

    await syncDatabase();
    console.log("✅ Database synced");

    if (initAlertScheduler) {
      initAlertScheduler();
      console.log("✅ Alert scheduler initialized");
    }

    if (initDailyTripReset) {
      initDailyTripReset();
    }

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      socket.on("tracking:subscribeRoute", ({ routeName } = {}) => {
        if (routeName) socket.join(`tracking:route:name:${toRoomKey(routeName)}`);
      });

      socket.on("tracking:unsubscribeRoute", ({ routeName } = {}) => {
        if (routeName) socket.leave(`tracking:route:name:${toRoomKey(routeName)}`);
      });
    });

    setSocketIO(io);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api/v1`);
      console.log(`🛰️ Socket.IO ready on ws://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("❌ Failed to start server:");

    if (err.name === "SequelizeConnectionRefusedError") {
      console.error("👉 Database connection refused. Check:");
      console.error("- Is MySQL/PostgreSQL running?");
      console.error("- Host, port, username, password correct?");
    }

    if (err.name === "SequelizeAccessDeniedError") {
      console.error("👉 Database access denied. Check credentials.");
    }

    console.error(err.message);

    process.exit(1);
  }
};

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

start();