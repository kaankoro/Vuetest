import axios from "axios";

export function useUpload({ clientId, description, uploadProgress, compressionProgress, duration, startTime, stopTime, video, router }) {
  let blobNumber = 0;
  let blobList = [];

  const uploadBlobs = async (data) => {
    if (data) {
      blobList.push({ data, number: ++blobNumber });
    }

    while (blobList.length > 0) {
      const blob = blobList.shift();
      await uploadChunk(blob.data, blob.number);
    }
  };

  const uploadChunk = async (chunk, number) => {
    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("clientId", clientId.value);
    formData.append("blobNumber", number);

    try {
      await axios.post(`${import.meta.env.VITE_CONNECTION_LINK}/upload-chunk`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Uploaded blob number: ", number);
    } catch (error) {
      console.error("No connection, retrying.");
      blobList.push({ data: chunk, number });
    }
  };

  const finalizeUpload = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_CONNECTION_LINK}/finalize-upload`, {
        description: description.value,
        clientId: clientId.value,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return { uploadBlobs, finalizeUpload };
}
