<template>
  <div>
    <div class="flex justify-center gap-2 mb-2">
      <button class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
        v-if="!isRecording && !doneRecording" @click="startRecording">
        Start Recording
      </button>
      <button class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
        v-if="isRecording && !doneRecording" @click="stopRecording">
        Stop Recording
      </button>
    </div>
    <div class="grid justify-items-center justify-center">
      <video v-if="!doneRecording" ref="video" width="320" height="240" autoplay muted></video>
      <div v-if="recordedBlob">
        <input v-model="description" placeholder="Enter description" />
        <button v-if="uploadDone" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded" @click="saveVideo">
          Save Video
        </button>
        <button v-else class="bg-gray-300 text-gray-400 font-bold py-2 px-4 rounded" disabled>
          Save Video
        </button>
      </div>
      <div v-if="uploadProgress > 0">
        <p>Chunk count: {{ uploadProgress }}</p>
      </div>
      <div v-if="compressionProgress">
        <p>Compression Progress: {{ compressionProgress }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useWebSocket } from "../composables/useWebSocket";
import { useUpload } from "../composables/useUpload";
import adapter from "webrtc-adapter";
import axios from 'axios';


const video = ref(null);
const mediaRecorder = ref(null);
const recordedBlob = ref(null);
const description = ref("");
const isRecording = ref(false);
const doneRecording = ref(false);
const uploadProgress = ref(0);
const compressionProgress = ref(0);
const startTime = ref(null);
const stopTime = ref(null);
const duration = ref(0);
const clientId = ref(null);
const uploadDone = ref(false);

let stream;

const router = useRouter();
const { socket, setupWebSocketEvents } = useWebSocket();
const { uploadBlobs, finalizeUpload, isUploadDone } = useUpload({
  clientId,
  description,
  uploadProgress,
  compressionProgress,
  duration,
  startTime,
  stopTime,
  video,
  router,
});

setupWebSocketEvents(socket, {
  clientId,
  uploadProgress,
  compressionProgress,
  duration,
  router,
});

const startRecording = async () => {
  stream = await getMediaStream();
  initializeMediaRecorder(stream);
  startMediaRecorder();
};

const stopRecording = async () => {
  mediaRecorder.value.stop();
  isRecording.value = false;
  sendRecordingStopped();
};

const stopStream = async () => {
  stream.getTracks()
    .forEach(track => track.stop());
}

const sendRecordingStopped = async () => {
  try {
    await axios.post(`${import.meta.env.VITE_CONNECTION_LINK}/done`, {
      description: description.value,
      clientId: clientId.value,
    });
  } catch (error) {
    console.error(error);
  }
}

const saveVideo = async () => {
  await finalizeUpload();
};

const isMobile = () => {
  console.log(navigator.userAgent)
  return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
}

const getMediaStream = async () => {
  const constraints = {
    audio: {
      sampleRate: 48000,
      channelCount: 2,
      volume: 1.0
    },
    video: {}
  };

  if (isMobile()) {
    constraints.video = {
      width: { exact: 720 },
      aspectRatio: { ideal: 9 / 16 },
      frameRate: 24
    };
  }
  else {
    constraints.video = {
      width: { exact: 1280 },
      height: { exact: 720 },
      frameRate: 24
    };
  }


  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    console.error('Error accessing media devices.', err);
    throw err;
  }
};


const initializeMediaRecorder = (stream) => {
  video.value.srcObject = stream;
  mediaRecorder.value = new MediaRecorder(stream);
  mediaRecorder.value.ondataavailable = handleDataAvailable;
  mediaRecorder.value.onstart = handleStart;
  mediaRecorder.value.onstop = handleStop;
};

const startMediaRecorder = () => {
  mediaRecorder.value.start(500);
  isRecording.value = true;
};

const handleDataAvailable = async (event) => {
  if (event.data.size > 0) {
    await uploadBlobs(event.data);
  }
};

const handleStart = () => {
  startTime.value = Date.now();
};

const handleStop = async () => {
  recordedBlob.value = true;
  stopTime.value = Date.now();
  duration.value += Math.round((stopTime.value - startTime.value) / 1000);
  doneRecording.value = true;
  await uploadBlobs();
  const doneRecordingInterval = setInterval(() => {
    if(isUploadDone()) {
      uploadDone.value = true;
      clearInterval(doneRecordingInterval);
    }
  }, 1000);
};

router.beforeEach((to, from, next) => {
  handleRouteChange(from, to);
  next();
});

const handleRouteChange = (from, to) => {
  if (from.path === "/record-videos" && to.path !== "/record-videos") {
    socket.disconnect();
    if (mediaRecorder.value) {
      mediaRecorder.value.stop();
      stopStream();
    }
  }
};

onMounted(() => {
  console.log("WebRTC adapter.js loaded:", adapter.browserDetails.browser);
});
</script>

<style scoped>
video {
  margin-bottom: 20px;
}
</style>
