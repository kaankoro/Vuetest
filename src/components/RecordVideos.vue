<template>
  <div>
    <div class="flex justify-center gap-2 mb-2">
      <button class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded" v-if="!isRecording && !doneRecording" @click="startRecording">Start Recording</button>
      <button class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded" v-if="isRecording && !doneRecording" @click="stopRecording">Stop Recording</button>
    </div>
    <div class="grid justify-items-center justify-center">
      <video ref="video" width="320" height="240" autoplay></video>
      <div v-if="recordedBlob">
        <input v-model="description" placeholder="Enter description" />
        <button class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded" @click="saveVideo">Save Video</button>
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
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import io from 'socket.io-client';

const socket = io('https://34.131.131.231');

const video = ref(null);
const mediaRecorder = ref(null);
const recordedBlob = ref(null);
const description = ref('');
const isRecording = ref(false);
const doneRecording = ref(false);
const uploadProgress = ref(0);
const compressionProgress = ref(0);
const router = useRouter();
const startTime = ref(null);
const stopTime = ref(null);
const duration = ref(null);
const clientId = ref(null); // Generate a unique ID for the client
let blobNumber = 0; // Counter for blobs
let blobList = [];
//let uploading = false;

function toSeconds(timeString) {
  const [hoursStr, minutesStr, secondsStr] = timeString.split(':');
  const [secondsPart, millisecondsStr] = secondsStr.split('.');

  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  const seconds = parseInt(secondsPart, 10);
  const milliseconds = parseInt(millisecondsStr, 10);

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 100;
}

const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.value.srcObject = stream;
  blobList = [];
  blobNumber = 0; // Reset the counter when recording starts
  //uploading = false;

  if (!mediaRecorder.value) {
    mediaRecorder.value = new MediaRecorder(stream);
  }

  mediaRecorder.value.ondataavailable = async (event) => {
    if (event.data.size > 0) {
      blobNumber++;
      blobList.push({ data: event.data, number: blobNumber });
      // if (!uploading) {
        uploadBlobs();
      // }
    }
  };

  mediaRecorder.value.onstart = () => {
    startTime.value = Date.now(); // Record start time
  };

  mediaRecorder.value.onstop = async () => {
    recordedBlob.value = true;
    stopTime.value = Date.now();
    duration.value += Math.round((stopTime.value - startTime.value) / 1000);
    console.log('Recording duration:', duration.value);
    doneRecording.value = true;
    // if (!uploading) {
      uploadBlobs();
    // }
  };

  mediaRecorder.value.start(500); // Adjust the timeslice value to control the chunk upload interval
  isRecording.value = true;
};

const stopRecording = async () => {
  mediaRecorder.value.stop();
  isRecording.value = false;
  try {
    await axios.post('https://34.131.131.231/done', { description: description.value, clientId });
  } catch (error) {
    console.error(error);
  }
};

const uploadBlobs = async () => {
  if (blobList.length === 0 /*|| uploading*/) return;
  // uploading = true;

  while (blobList.length > 0) {
    const blob = blobList.shift();
    await uploadChunk(blob.data, blob.number);
  }

  // uploading = false;
  // if (doneRecording.value && blobList.length === 0) {
  //   await finalizeUpload();
  // }
};

const uploadChunk = async (chunk, number, retry = false) => {
  const formData = new FormData();
  formData.append('chunk', chunk);
  formData.append('clientId', clientId.value);
  formData.append('blobNumber', number); // Include blob number

  try {
    await axios.post('https://34.131.131.231/upload-chunk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log("Uploaded blob number: ", number);
  } catch (error) {
    console.error(error);
    if (!retry) {
      blobList.push({ data: chunk, number });
    }
  }
};

const finalizeUpload = async () => {
  try {
    await axios.post('https://34.131.131.231/finalize-upload', { description: description.value, clientId });
  } catch (error) {
    console.error(error);
  }
};

const saveVideo = async () => {
  await finalizeUpload();
};

socket.on('upload-progress', ({ clientId: id, progress }) => {
  if (id === clientId.value) {
    uploadProgress.value = progress;
  }
});

socket.on('connected', (id) => {
  if (clientId.value == null) {
    clientId.value = id;
  }
});

socket.on('compression-progress', ({ clientId: id, progress }) => {
  if (id === clientId.value) {
    compressionProgress.value = (toSeconds(progress["timemark"]) / duration.value * 100).toFixed(2);
    if (compressionProgress.value > 100) compressionProgress.value = 100;
  }
});

socket.on('compression-complete', ({ clientId: id }) => {
  if (id === clientId.value) {
    router.push({ name: 'View' });
  }
});

router.beforeEach((to, from, next) => {
  if (from.path === '/record-videos' && to.path !== '/record-videos') {
    socket.disconnect();
    console.log('Socket disconnected due to navigation away from /record-videos');
  }
  next();
});
</script>

<style scoped>
video {
  margin-bottom: 20px;
}
</style>