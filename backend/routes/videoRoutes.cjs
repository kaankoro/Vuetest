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
  const { clientId, blobNumber, chunkPath } = extractChunkDetails(req);
  initializeClientState(clientId);

  uploadChunks[clientId].set(blobNumber, chunkPath);

  notifyClientUploadProgress(req.app.get("io"), clientId);
  produceKafkaMessage(clientId, chunkPath);
  resetCleanupTimeout(clientId);

  res.status(200).json({ message: "Chunk uploaded successfully" });
});

function extractChunkDetails(req) {
  return {
    clientId: req.body.clientId,
    blobNumber: parseInt(req.body.blobNumber),
    chunkPath: req.file.path,
  };
}

function initializeClientState(clientId) {
  if (!uploadChunks[clientId]) {
    uploadChunks[clientId] = new Map();
    doneRecording[clientId] = false;
  }
}

function notifyClientUploadProgress(io, clientId) {
  io.emit("upload-progress", {
    clientId,
    progress: uploadChunks[clientId].size,
  });
}

function produceKafkaMessage(clientId, chunkPath) {
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
}

function resetCleanupTimeout(clientId) {
  clearTimeout(cleanupTimeouts[clientId]);
  cleanupTimeouts[clientId] = setTimeout(() => {
    if (!doneRecording[clientId]) {
      console.log(`Cleaning up client ${clientId} due to inactivity`);
      cleanupClient(clientId, uploadChunks, doneRecording, cleanupTimeouts);
    }
  }, 60000);
}

/**
 * Finalizes the upload by combining all the chunks into a single video file.
 * Compresses the video using ffmpeg and saves it to the database.
 */
router.post("/finalize-upload", async (req, res) => {
  const { description, clientId, videoDir, videoPath } =
    extractFinalizeDetails(req);

  try {
    const writeStream = fs.createWriteStream(videoPath);
    await writeChunksToStream(writeStream, uploadChunks[clientId]);

    writeStream.on("finish", () => {
      compressVideoHandler(
        videoPath,
        videoDir,
        clientId,
        description,
        res,
        req.app.get("io")
      );
    });
  } catch (error) {
    res.status(500).json({ message: "Error finalizing upload", error });
  }
});

function extractFinalizeDetails(req) {
  const videoDir = "uploads/";
  return {
    description: req.body.description,
    clientId: req.body.clientId,
    videoDir,
    videoPath: `${videoDir}${Date.now()}.webm`,
  };
}

async function writeChunksToStream(writeStream, chunks) {
  const sortedChunkNumbers = Array.from(chunks.keys()).sort((a, b) => a - b);
  for (const blobNumber of sortedChunkNumbers) {
    const chunkPath = chunks.get(blobNumber);
    const chunk = fs.readFileSync(chunkPath);
    writeStream.write(chunk);
  }
  writeStream.end();
}

function compressVideoHandler(
  videoPath,
  videoDir,
  clientId,
  description,
  res,
  io
) {
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
}

/**
 * Retrieves the list of videos from the database,
 * checks if each video file exists in the uploads folder,
 * and removes entries for videos that no longer exist.
 */
router.get("/videos", async (req, res) => {
  try {
    const videos = await fetchAllVideos();
    const validVideos = await filterValidVideos(
      videos,
      path.join(__dirname, "..")
    );
    res.json(validVideos);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving videos", error });
  }
});

async function fetchAllVideos() {
  return await Video.find().lean();
}

async function filterValidVideos(videos, videoDir) {
  const validVideos = [];
  for (const video of videos) {
    const videoPath = path.join(videoDir, video.videoPath);
    if (fs.existsSync(videoPath)) {
      validVideos.push(video);
    }
  }
  return validVideos;
}

/**
 * Marks the recording as done for the given client.
 * Clears any pending cleanup timeouts.
 */
router.post("/done", (req, res) => {
  const clientId = req.body.clientId;
  markRecordingDone(clientId);
  res.status(200).json({ message: "Recording marked as done" });
});

function markRecordingDone(clientId) {
  doneRecording[clientId] = true;
  clearTimeout(cleanupTimeouts[clientId]);
}

module.exports = router;
