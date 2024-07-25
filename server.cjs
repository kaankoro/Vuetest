const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const http = require("http");
const socketIo = require("socket.io");
const Kafkaesque = require("kafkaesque");
const ffmpeg = require("fluent-ffmpeg");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const kafka = Kafkaesque({
  brokers: [{ host: "localhost", port: 9092 }],
  clientId: "video-upload-service",
  retry: {
    retries: 5,
    factor: 3,
    minTimeout: 1000,
    maxTimeout: 3000,
  },
  compression: "gzip",
});

const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@videorecording.1q6gayp.mongodb.net/`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const videoSchema = new mongoose.Schema({
  description: String,
  videoPath: String,
});

const Video = mongoose.model("Video", videoSchema);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${Date.now()}-${file.originalname}-${Math.floor(
        Math.random() * 1000000
      )}`
    );
  },
});

const upload = multer({ storage });

let uploadChunks = {};
let doneRecording = {};
let cleanupTimeouts = {};

// WebSocket connection setup
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  io.emit("connected", socket.id);

  socket.on("disconnect", () => {
    if (doneRecording[socket.id]) {
      cleanupClient(socket.id);
    }
    console.log("Client disconnected:", socket.id);
  });
});

/**
 * Handles the uploading of video chunks.
 * Stores the chunks in a Map and tracks their upload progress.
 * Sets a timeout to clean up if no chunks are received for 60 seconds.
 */
app.post("/upload-chunk", upload.single("chunk"), (req, res) => {
  const chunkPath = req.file.path;
  const clientId = req.body.clientId;
  const blobNumber = parseInt(req.body.blobNumber);

  if (!uploadChunks[clientId]) {
    uploadChunks[clientId] = new Map();
    doneRecording[clientId] = false;
  }

  uploadChunks[clientId].set(blobNumber, chunkPath);

  io.emit("upload-progress", {
    clientId,
    progress: uploadChunks[clientId].size,
  });

  // Produce message to Kafka
  kafka.produce(
    {
      topic: "upload-chunks",
      partition: 0,
      messages: JSON.stringify({ clientId, chunkPath }),
    },
    (err) => {
      if (err) {
        console.error("Kafka produce error:", err);
      } else {
        console.log("Message produced to Kafka:", { clientId, chunkPath });
      }
    }
  );

  res.status(200).json({ message: "Chunk uploaded successfully" });

  clearTimeout(cleanupTimeouts[clientId]);
  cleanupTimeouts[clientId] = setTimeout(() => {
    if (!doneRecording[clientId]) {
      console.log(`Cleaning up client ${clientId} due to inactivity`);
      cleanupClient(clientId);
    }
  }, 60000);
});

/**
 * Finalizes the upload by combining all the chunks into a single video file.
 * Compresses the video using ffmpeg and saves it to the database.
 */
app.post("/finalize-upload", async (req, res) => {
  const description = req.body.description;
  const clientId = req.body.clientId._value;
  const videoDir = "uploads/";
  const videoPath = `${videoDir}${Date.now()}.webm`;

  try {
    const writeStream = fs.createWriteStream(videoPath);
    const chunks = uploadChunks[clientId];

    const sortedChunkNumbers = Array.from(chunks.keys()).sort((a, b) => a - b);
    for (const blobNumber of sortedChunkNumbers) {
      const chunkPath = chunks.get(blobNumber);
      const chunk = fs.readFileSync(chunkPath);
      writeStream.write(chunk);
    }
    writeStream.end();

    writeStream.on("finish", () => {
      const compressedVideoPath = `${videoDir}${Date.now()}-compressed.webm`;

      io.emit("compression-start", { clientId });

      ffmpeg(videoPath)
        .output(compressedVideoPath)
        .videoCodec("libvpx")
        .audioCodec("libvorbis")
        .on("end", async () => {
          fs.unlinkSync(videoPath); // Remove the original video file

          const newVideo = new Video({
            description,
            videoPath: compressedVideoPath,
          });
          await newVideo.save();

          cleanupClient(clientId);

          io.emit("compression-complete", { clientId, video: newVideo });

          res.status(201).json({
            message: "Video uploaded and compressed successfully",
            video: newVideo,
          });
        })
        .on("error", (err) => {
          console.error("Compression error:", err);
          res
            .status(500)
            .json({ message: "Error compressing video", error: err });
        })
        .on("progress", (progress) => {
          io.emit("compression-progress", { clientId, progress });
        })
        .run();
    });
  } catch (error) {
    res.status(500).json({ message: "Error finalizing upload", error });
  }
});

/**
 * Retrieves the list of videos from the database,
 * checks if each video file exists in the uploads folder,
 * and removes entries for videos that no longer exist.
 */
app.get('/videos', async (req, res) => {
  try {
    const videos = await Video.find().lean();
    const videoDir = path.join(__dirname);
    let videosToSend = [];
    for (const video of videos) {
      const videoPath = path.join(videoDir, video.videoPath);
      if (fs.existsSync(videoPath)) {
        videosToSend.push(video);
      }
    }
    res.json(videosToSend);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving videos', error });
  }
});

/**
 * Marks the recording as done for the given client.
 * Clears any pending cleanup timeouts.
 */
app.post("/done", async (req, res) => {
  const clientId = req.body.clientId;
  doneRecording[clientId] = true;
  clearTimeout(cleanupTimeouts[clientId]);
  res.status(200).json({ message: "Recording marked as done" });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/**
 * Cleans up all chunks and associated data for the given client.
 * Removes the temporary chunk files from the server.
 */
function cleanupClient(clientId) {
  try {
    uploadChunks[clientId].forEach((chunkPath) => {
      fs.unlinkSync(chunkPath);
    });
    delete uploadChunks[clientId];
    delete doneRecording[clientId];
    delete cleanupTimeouts[clientId];
  } catch (error) {
    console.log("Error during cleanup:", error);
  }
}
