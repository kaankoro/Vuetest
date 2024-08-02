const fs = require("fs");

/**
 * Cleans up all chunks and associated data for the given client.
 * Removes the temporary chunk files from the server.
 *
 * @param {string} clientId - The ID of the client to clean up.
 * @param {object} uploadChunks - The map of upload chunks for all clients.
 * @param {object} doneRecording - The map indicating whether recording is done for all clients.
 * @param {object} cleanupTimeouts - The map of cleanup timeouts for all clients.
 * @param {object} createdVideos - The map of created videos.
 */
const cleanupClient = (
  clientId,
  uploadChunks,
  doneRecording,
  cleanupTimeouts,
  createdVideos
) => {
  try {
    uploadChunks[clientId].forEach((chunkPath) => {
      fs.unlinkSync(chunkPath);
    });
  } catch (error) {
    console.log("No chunks");
  }
  try {
    console.log(createdVideos[clientId])
    createdVideos[clientId].forEach((videoPath) => {
      fs.unlinkSync(videoPath);
    });
  } catch (error) {
    console.log("No video");
  }
  try {
    delete uploadChunks[clientId];
    delete doneRecording[clientId];
    delete cleanupTimeouts[clientId];
    delete createdVideos[clientId];  
  } catch (error) {
    console.log("Error during cleanup:", error);
  }
};

module.exports = { cleanupClient };
