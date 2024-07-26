const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const Video = require("../models/video.cjs");
const { cleanupClient } = require("./cleanup.cjs");

/**
 * Compresses the given video file and saves the compressed version to the database.
 *
 * @param {string} videoPath - Path to the video file to compress.
 * @param {string} videoDir - Directory where the compressed video will be saved.
 * @param {string} clientId - Unique identifier for the client.
 * @param {string} description - Description to associate with the video.
 * @param {Object} res - Express response object.
 * @param {Object} io - Socket.io instance.
 * @param {Object} uploadChunks - Object tracking video chunks.
 * @param {Object} doneRecording - Object tracking recording completion status.
 * @param {Object} cleanupTimeouts - Object tracking cleanup timeouts.
 */
const compressVideo = (
  videoPath,
  videoDir,
  clientId,
  description,
  res,
  io,
  uploadChunks,
  doneRecording,
  cleanupTimeouts
) => {
  const compressedVideoPath = generateCompressedVideoPath(videoDir);

  emitCompressionStart(io, clientId);

  ffmpeg(videoPath)
    .output(compressedVideoPath)
    .videoCodec("libvpx")
    .audioCodec("libvorbis")
    .on("end", () =>
      handleCompressionEnd(
        videoPath,
        compressedVideoPath,
        description,
        clientId,
        res,
        io,
        uploadChunks,
        doneRecording,
        cleanupTimeouts
      )
    )
    .on("error", (err) => handleCompressionError(err, res))
    .on("progress", (progress) =>
      emitCompressionProgress(io, clientId, progress)
    )
    .run();
};

function generateCompressedVideoPath(videoDir) {
  return `${videoDir}${Date.now()}-compressed.webm`;
}

function emitCompressionStart(io, clientId) {
  io.emit("compression-start", { clientId });
}

async function handleCompressionEnd(
  videoPath,
  compressedVideoPath,
  description,
  clientId,
  res,
  io,
  uploadChunks,
  doneRecording,
  cleanupTimeouts
) {
  fs.unlinkSync(videoPath); // Remove the original video file

  const newVideo = new Video({
    description,
    videoPath: compressedVideoPath,
  });
  await newVideo.save();

  cleanupClient(clientId, uploadChunks, doneRecording, cleanupTimeouts);

  io.emit("compression-complete", { clientId, video: newVideo });

  res.status(201).json({
    message: "Video uploaded and compressed successfully",
    video: newVideo,
  });
}

function handleCompressionError(err, res) {
  console.error("Compression error:", err);
  res.status(500).json({ message: "Error compressing video", error: err });
}

function emitCompressionProgress(io, clientId, progress) {
  io.emit("compression-progress", { clientId, progress });
}

module.exports = { compressVideo };
