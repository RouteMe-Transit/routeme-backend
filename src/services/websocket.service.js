let io = null;

const toRoomKey = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const setSocketIO = (server) => {
  io = server;
};

const getSocketIO = () => io;

const emitLiveTrackingUpdate = (payload) => {
  if (!io) return;

  io.emit("tracking:busLocationUpdated", payload);
  if (payload.routeName) {
    io.to(`tracking:route:name:${toRoomKey(payload.routeName)}`).emit("tracking:routeBusUpdate", payload);
  }
};

module.exports = {
  setSocketIO,
  getSocketIO,
  emitLiveTrackingUpdate,
  toRoomKey,
};
