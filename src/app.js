const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();
const ignoredRequestPatterns = [/^\/_next\/webpack-hmr/, /^\/favicon\.ico$/i];

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
}));

// Request logging
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
    skip: (req) => ignoredRequestPatterns.some((pattern) => pattern.test(req.path)),
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Ignore common browser/frontend-dev requests that don't belong to this API server.
app.get("/_next/webpack-hmr", (req, res) => {
  res.status(204).end();
});

app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

app.get("/login", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Frontend route. Use the client application for /login.",
  });
});

// API routes
app.use("/api/v1", routes);
app.get("/", (req, res) => {
  res.send("RouteMe API is running 🚀");
});
// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
