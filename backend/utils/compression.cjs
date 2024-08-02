const ffmpeg = require("fluent-ffmpeg");


/**
 * Compresses the given video file and saves the compressed version to the database.
 *
 * @param {string} videoPath - Path to the video file to compress.
 * @param {string} videoDir - Directory where the compressed video will be saved.
 * @param {string} clientId - Unique identifier for the client.
 * @param {string} description - Description to associate with the video.
 * @param {Object} res - Express response object.
 * @param {Object} io - Socket.io instance.
 * @param {Object} createdVideos - Videos that are created for the user.
 */
const compressVideo = (
  videoPath,
  videoDir,
  clientId,
  description,
  res,
  io,
  createdVideos
) => {
  const compressedVideoPath = generateCompressedVideoPath(videoDir);
   createdVideos[clientId].push(compressedVideoPath);


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

async function initializeVideoState(clientId) {
  if (!createdVideos[clientId]) {
    createdVideos[clientId] = [];
  }
}


async function handleCompressionEnd(
  videoPath,
  compressedVideoPath,
  description,
  clientId,
  res,
  io,
) {


  io.emit("compression-complete", { clientId });

}

function handleCompressionError(err, res) {
  console.error("Compression error:", err);
  res.status(500).json({ message: "Error compressing video", error: err });
}

function emitCompressionProgress(io, clientId, progress) {
  io.emit("compression-progress", { clientId, progress });
}

module.exports = { compressVideo };
