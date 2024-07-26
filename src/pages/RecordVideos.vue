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
      <video ref="video" width="320" height="240" autoplay></video>
      <div v-if="recordedBlob">
        <input v-model="description" placeholder="Enter description" />
        <button class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded" @click="saveVideo">
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

const router = useRouter();
const { socket, setupWebSocketEvents } = useWebSocket();
const { uploadBlobs, finalizeUpload } = useUpload({ clientId, description, uploadProgress, compressionProgress, duration, startTime, stopTime, video, router });

setupWebSocketEvents(socket, { clientId, uploadProgress, compressionProgress, duration, router });

const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.value.srcObject = stream;
  mediaRecorder.value = new MediaRecorder(stream);

  mediaRecorder.value.ondataavailable = async (event) => {
    if (event.data.size > 0) {
      await uploadBlobs(event.data);
    }
  };

  mediaRecorder.value.onstart = () => {
    startTime.value = Date.now();
  };

  mediaRecorder.value.onstop = async () => {
    recordedBlob.value = true;
    stopTime.value = Date.now();
    duration.value += Math.round((stopTime.value - startTime.value) / 1000);
    doneRecording.value = true;
    await uploadBlobs();
  };

  mediaRecorder.value.start(500);
  isRecording.value = true;
};

const stopRecording = async () => {
  mediaRecorder.value.stop();
  isRecording.value = false;
};

const saveVideo = async () => {
  await finalizeUpload();
};

router.beforeEach((to, from, next) => {
  if (from.path === "/record-videos" && to.path !== "/record-videos") {
    socket.disconnect();
    if (mediaRecorder.value) {
      mediaRecorder.value.stop();
    }
  }
  next();
});

onMounted(() => {
  console.log("WebRTC adapter.js loaded:", adapter.browserDetails.browser);
});
</script>

<style scoped>
video {
  margin-bottom: 20px;
}
</style>
