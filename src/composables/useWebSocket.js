import io from "socket.io-client";
import toSeconds from "../utils/time";

export function useWebSocket() {
  const socket = io(import.meta.env.VITE_CONNECTION_LINK);

  const setupWebSocketEvents = (
    socket,
    { clientId, uploadProgress, compressionProgress, duration, compressionComplete, videoPath }
  ) => {
    socket.on("upload-progress", ({ clientId: id, progress }) => {
      if (id === clientId.value) {
        uploadProgress.value = progress;
      }
    });

    socket.on("connected", (id) => {
      if (clientId.value == null) {
        clientId.value = id;
      }
    });

    socket.on("merged-video", ({clientId: id, videoPath}) => {
      if (clientId.value == id) {
        displayVideo.value = videoPath;
      }
    });

    socket.on("compression-progress", ({ clientId: id, progress }) => {
      if (id === clientId.value) {
        compressionProgress.value = (
          (toSeconds(progress["timemark"]) / duration.value) *
          100
        ).toFixed(2);
        if (compressionProgress.value > 100) compressionProgress.value = 100;
      }
    });

    socket.on("compression-complete", ({ clientId: id }) => {
      if (id === clientId.value) {
        compressionComplete.value = true;
      }
    });
  };

  return { socket, setupWebSocketEvents };
}
