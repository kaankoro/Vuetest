const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const dotenv = require("dotenv");

dotenv.config();

const { connectMongo } = require("./config/mongo.cjs");
const { router } = require("./routes/videoRoutes.cjs");
const { setupWebSocket } = require("./routes/webSocket.cjs");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectMongo();

app.use("", router);
setupWebSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
