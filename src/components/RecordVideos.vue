<template>
  <div>
    <div class="flex justify-center gap-2 mb-2">
    <button class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded" v-if="!isRecording && !doneRecording" @click="startRecording">Start Recording</button>
    <button class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded" v-if="isRecording && !doneRecording" @click="stopRecording">Stop Recording</button>
    <button class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded" v-if="isRecording && !doneRecording" @click="connectionHandler">Disconnect/connect</button>
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
const disconnect = ref(false);
const startTime = ref(null);
const stopTime = ref(null);
const duration = ref(null);
const clientId = ref(null); // Generate a unique ID for the client
let blob_list = []

function toSeconds(timeString) {
  const [hoursStr, minutesStr, secondsStr] = timeString.split(':');
  const [secondsPart, millisecondsStr] = secondsStr.split('.');

  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  const seconds = parseInt(secondsPart, 10);
  const milliseconds = parseInt(millisecondsStr, 10);

  return hours * 3600 + minutes * 60 + seconds + milliseconds/100
}

const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.value.srcObject = stream;
  blob_list = [];

  if(!mediaRecorder.value) {
    mediaRecorder.value = new MediaRecorder(stream);
  }
  mediaRecorder.value.ondataavailable = async (event) => {
    if (event.data.size > 0 && !disconnect.value && blob_list.length > 0) {
      for (var i = 0; i < blob_list.length; ++ i) {
        await uploadChunk(blob_list[i], true, blob_list.length == i + 1);
      }
      await uploadChunk(event.data, false);
    }
    else if (event.data.size > 0 && !disconnect.value) {
      await uploadChunk(event.data, false);
    }
    else {
      blob_list.push(event.data);
    }
  };
  mediaRecorder.value.onstart = () => {
    startTime.value = Date.now(); // Record start time
  };
  mediaRecorder.value.onstop = async () => {
    recordedBlob.value = true;
    stopTime.value = Date.now();
    duration.value += Math.round((stopTime.value - startTime.value)/1000);
    console.log('Recording duration:', duration.value);
  };

  mediaRecorder.value.start(2000); // Adjust the timeslice value to control the chunk upload interval
  isRecording.value = true;
};

const stopRecording = async () => {
  mediaRecorder.value.stop();
  doneRecording.value = true;
  isRecording.value = false;
  try {
    await axios.post('https://34.131.131.231/done', { description: description.value, clientId });
  } catch (error) {
    console.error(error);
  }
};

const connectionHandler = () => {
  disconnect.value = !disconnect.value;
  console.log(disconnect.value)
}

const uploadChunk = async (chunk, retry, last_value=false) => {
  const formData = new FormData();
  formData.append('chunk', chunk);
  formData.append('clientId', clientId.value);
  console.log("value:", clientId.value)

  try {
    await axios.post('https://34.131.131.231/upload-chunk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (last_value) {
      blob_list = []
    }
  } catch (error) {
    console.error(error);
    if (!retry) {
      console.log(blob_list.length)
      blob_list.push(chunk);
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
  if(clientId.value == null) {
    clientId.value=id;
  }
});

socket.on('compression-progress', ({ clientId: id, progress }) => {

  if (id === clientId.value) {
    compressionProgress.value = (toSeconds(progress["timemark"])/duration.value*100).toFixed(2);
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