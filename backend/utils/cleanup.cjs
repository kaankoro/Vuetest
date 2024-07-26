const fs = require("fs");

/**
 * Cleans up all chunks and associated data for the given client.
 * Removes the temporary chunk files from the server.
 * 
 * @param {string} clientId - The ID of the client to clean up.
 * @param {object} uploadChunks - The map of upload chunks for all clients.
 * @param {object} doneRecording - The map indicating whether recording is done for all clients.
 * @param {object} cleanupTimeouts - The map of cleanup timeouts for all clients.
 */
const cleanupClient = (clientId, uploadChunks, doneRecording, cleanupTimeouts) => {
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
};

module.exports = { cleanupClient };
