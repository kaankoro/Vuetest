const { cleanupClient } = require("../utils/cleanup.cjs");
const { uploadChunks, doneRecording, cleanupTimeouts } = require("./videoRoutes.cjs")


const setupWebSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    io.emit("connected", socket.id);

    socket.on("disconnect", () => {
      if (doneRecording[socket.id]) {
        cleanupClient(socket.id, uploadChunks, doneRecording, cleanupTimeouts);
      }
      console.log("Client disconnected:", socket.id);
    });
  });
};

module.exports = { setupWebSocket };
