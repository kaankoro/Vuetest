const express = require("express");
const fs = require("fs");
const path = require("path");
const kafka = require("../config/kafka.cjs");
const upload = require("../middlewares/upload.cjs");
const Video = require("../models/video.cjs");
const { cleanupClient } = require("../utils/cleanup.cjs");
const { compressVideo } = require("../utils/compression.cjs");

const router = express.Router();

let uploadChunks = {};
let doneRecording = {};
let cleanupTimeouts = {};

/**
 * Handles the uploading of video chunks.
 * Stores the chunks in a Map and tracks their upload progress.
 * Sets a timeout to clean up if no chunks are received for 60 seconds.
 */
router.post("/upload-chunk", upload.single("chunk"), (req, res) => {
  const chunkPath = req.file.path;
  const clientId = req.body.clientId;
  const blobNumber = parseInt(req.body.blobNumber);

  if (!uploadChunks[clientId]) {
    uploadChunks[clientId] = new Map();
    doneRecording[clientId] = false;
  }

  uploadChunks[clientId].set(blobNumber, chunkPath);

  const io = req.app.get("io"); // Get the io object from app
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
      cleanupClient(clientId, uploadChunks, doneRecording, cleanupTimeouts);
    }
  }, 60000);
});

/**
 * Finalizes the upload by combining all the chunks into a single video file.
 * Compresses the video using ffmpeg and saves it to the database.
 */
router.post("/finalize-upload", async (req, res) => {
  const description = req.body.description;
  const clientId = req.body.clientId;
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
      const io = req.app.get("io"); // Get the io object from app
      compressVideo(
        videoPath,
        videoDir,
        clientId,
        description,
        res,
        io,
        uploadChunks,
        doneRecording,
        cleanupTimeouts
      );
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
router.get("/videos", async (req, res) => {
  try {
    const videos = await Video.find().lean();
    const videoDir = path.join(__dirname, "..");
    let videosToSend = [];
    for (const video of videos) {
      const videoPath = path.join(videoDir, video.videoPath);
      if (fs.existsSync(videoPath)) {
        videosToSend.push(video);
      }
    }
    res.json(videosToSend);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving videos", error });
  }
});

/**
 * Marks the recording as done for the given client.
 * Clears any pending cleanup timeouts.
 */
router.post("/done", (req, res) => {
  const clientId = req.body.clientId;
  doneRecording[clientId] = true;
  clearTimeout(cleanupTimeouts[clientId]);
  res.status(200).json({ message: "Recording marked as done" });
});

router.get(
  "/.well-known/pki-validation/B64101A6FBA1EB37BDB23DBB32F00585.txt",
  (req, res) => {
    res.sendFile(
      path.join(__dirname, "../B64101A6FBA1EB37BDB23DBB32F00585.txt")
    );
  }
);

module.exports = router;
