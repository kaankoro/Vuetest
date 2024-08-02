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
let createdVideos = {};

/**
 * Handles the uploading of video chunks.
 * Stores the chunks in a Map and tracks their upload progress.
 * Sets a timeout to clean up if no chunks are received for 60 seconds.
 */
router.post("/upload-chunk", upload.single("chunk"), (req, res) => {
  try {
    const { clientId, blobNumber, chunkPath } = extractChunkDetails(req);
    initializeClientState(clientId);
    console.log(clientId + ": " + blobNumber);

    uploadChunks[clientId].set(blobNumber, chunkPath);

    notifyClientUploadProgress(req.app.get("io"), clientId);
    produceKafkaMessage(clientId, chunkPath);
    resetCleanupTimeout(clientId);

    res.status(200).json({ message: "Chunk uploaded successfully" });
  } catch (error) {
    console.error("Error in /upload-chunk:", error);
    res.status(500).json({ message: "Error uploading chunk", error });
  }
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
      cleanupClient(
        clientId,
        uploadChunks,
        doneRecording,
        cleanupTimeouts,
        createdVideos
      );
    }
  }, 60000);
}

/**
 * Finalizes the upload by adding the video to the database.
 */
router.post("/finalize-upload", async (req, res) => {
  const { description, clientId, videoPath } = req.body;

  try {
    const newVideo = new Video({
      description,
      videoPath,
    });
    await newVideo.save();

     // remove the compressed video from the list so it doesn't get deleted
    createdVideos[clientId].pop();

    req.app.get("io").emit("upload-finalized", { clientId, video: newVideo });

    res.status(201).json({
      message: "Video uploaded successfully",
      video: newVideo,
    });
  } catch (error) {
    console.error("Error in /finalize-upload:", error);
    res.status(500).json({ message: "Error finalizing upload", error });
  }
});

async function writeChunksToStream(writeStream, chunks) {
  const sortedChunkNumbers = Array.from(chunks.keys()).sort((a, b) => a - b);
  for (const blobNumber of sortedChunkNumbers) {
    const chunkPath = chunks.get(blobNumber);
    const chunk = fs.readFileSync(chunkPath);
    writeStream.write(chunk);
  }
  writeStream.end();
}

/**
 * Marks the recording as done for the given client.
 * Merges the chunks and starts compression.
 */
router.post("/done", async (req, res) => {
  const clientId = req.body.clientId;
  markRecordingDone(clientId);

  try {
    const videoPath = await mergeChunks(req, res);

    res
      .status(200)
      .json({ message: "Recording marked as done and video merged" });
  } catch (error) {
    console.error("Error in /done:", error);
    res.status(500).json({ message: "Error merging video", error });
  }
});

async function initializeVideoState(clientId) {
  if (!createdVideos[clientId]) {
    createdVideos[clientId] = [];
  }
}

async function mergeChunks(req, res) {
  const clientId = req.body.clientId;
  const videoDir = "uploads/";
  const videoPath = `${videoDir}${Date.now()}.webm`;
  await initializeVideoState(clientId);
  createdVideos[clientId].push(videoPath);
  const writeStream = fs.createWriteStream(videoPath);
  const io = req.app.get("io");

  await writeChunksToStream(writeStream, uploadChunks[clientId]);
  writeStream.on("finish", () => {
    io.emit("merged-video", { clientId, videoPath });

    compressVideo(
      videoPath,
      videoDir,
      clientId,
      req.body.description || "",
      res,
      io,
      createdVideos
    );
  });

  uploadChunks[clientId].forEach((chunkPath) => {
    fs.unlinkSync(chunkPath);
  });
  delete uploadChunks[clientId];
  return videoPath;
}

function markRecordingDone(clientId) {
  doneRecording[clientId] = true;
  clearTimeout(cleanupTimeouts[clientId]);
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
    console.error("Error in /videos:", error);
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

module.exports = {
  router,
  uploadChunks,
  doneRecording,
  cleanupTimeouts,
  createdVideos,
};
