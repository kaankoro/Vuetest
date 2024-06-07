<template>
  <div>
    <button v-if="!isRecording" @click="startRecording">Start Recording</button>
    <button v-if="isRecording" @click="stopRecording">Stop Recording</button>
    <video ref="video" width="320" height="240" autoplay></video>
    <div v-if="recordedBlob">
      <input v-model="description" placeholder="Enter description" />
      <button @click="saveVideo">Save Video</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const video = ref(null);
const mediaRecorder = ref(null);
const recordedChunks = ref([]);
const recordedBlob = ref(null);
const description = ref('');
const isRecording = ref(false);

const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.value.srcObject = stream;

  mediaRecorder.value = new MediaRecorder(stream);
  mediaRecorder.value.ondataavailable = (event) => {
    recordedChunks.value.push(event.data);
  };
  mediaRecorder.value.onstop = () => {
    recordedBlob.value = new Blob(recordedChunks.value, { type: 'video/webm' });
    const videoURL = URL.createObjectURL(recordedBlob.value);
    video.value.src = videoURL;
    video.value.controls = true;
    video.value.srcObject = null;
  };

  mediaRecorder.value.start();
  isRecording.value = true;
};

const stopRecording = () => {
  mediaRecorder.value.stop();
  isRecording.value = false;
};

const saveVideo = async () => {
  const formData = new FormData();
  formData.append('video', recordedBlob.value, 'video.webm');
  formData.append('description', description.value);

  try {
    const response = await axios.post('http://localhost:3000/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};
</script>
