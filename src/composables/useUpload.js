import axios from "axios";

/**
 * Uploads chunks of video data and finalizes the upload process.
 *
 * @param {Object} params - Parameters containing client ID and description.
 * @param {Ref} params.clientId - Vue ref holding the client ID.
 * @param {Ref} params.description - Vue ref holding the video description.
 * @returns {Object} - Functions to handle blob upload and finalization.
 */
export function useUpload({ clientId, description }) {
  let blobNumber = 0;
  let blobList = [];

  const uploadBlobs = async (data) => {
    if (data) {
      addBlobToList(data);
    }

    while (blobList.length > 0) {
      const blob = blobList.shift();
      await uploadChunk(blob.data, blob.number);
    }
  };

  /**
   * @param {Blob} data - Blob data to add to the list.
   */
  function addBlobToList(data) {
    blobList.push({ data, number: ++blobNumber });
  }

  const uploadChunk = async (chunk, number) => {
    const formData = createFormData(chunk, number);

    try {
      await sendUploadRequest(formData);
      console.log("Uploaded blob number: ", number);
    } catch (error) {
      console.error("No connection, retrying.");
      blobList.push({ data: chunk, number });
    }
  };

  function createFormData(chunk, number) {
    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("clientId", clientId.value);
    formData.append("blobNumber", number);
    return formData;
  }

  async function sendUploadRequest(formData) {
    await axios.post(
      `${import.meta.env.VITE_CONNECTION_LINK}/upload-chunk`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  }

  const finalizeUpload = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_CONNECTION_LINK}/finalize-upload`,
        {
          description: description.value,
          clientId: clientId.value,
        }
      );
    } catch (error) {
      console.error("Error finalizing upload:", error);
    }
  };

  return { uploadBlobs, finalizeUpload };
}
