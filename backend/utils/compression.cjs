const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const Video = require("../models/video.cjs");
const { cleanupClient } = require("./cleanup.cjs");

/**
 * Finalizes the upload by combining all the chunks into a single video file.
 * Compresses the video using ffmpeg and saves it to the database.
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

      cleanupClient(clientId, uploadChunks, doneRecording, cleanupTimeouts);

      io.emit("compression-complete", { clientId, video: newVideo });

      res.status(201).json({
        message: "Video uploaded and compressed successfully",
        video: newVideo,
      });
    })
    .on("error", (err) => {
      console.error("Compression error:", err);
      res.status(500).json({ message: "Error compressing video", error: err });
    })
    .on("progress", (progress) => {
      io.emit("compression-progress", { clientId, progress });
    })
    .run();
};

module.exports = { compressVideo };
