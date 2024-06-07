<template>
    <div>
      <h1>View Videos</h1>
      <div v-for="video in videos" :key="video._id" class="video-item">
        <video width="320" height="240" controls>
          <source :src="`http://localhost:3000/${video.videoPath}`" type="video/webm">
        </video>
        <p>{{ video.description }}</p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import axios from 'axios';
  
  const videos = ref([]);
  
  const fetchVideos = async () => {
    try {
      const response = await axios.get('http://localhost:3000/videos');
      videos.value = response.data;
    } catch (error) {
      console.error(error);
    }
  };
  
  onMounted(fetchVideos);
  </script>
  
  <style scoped>
  .video-item {
    margin-bottom: 20px;
  }
  </style>
  