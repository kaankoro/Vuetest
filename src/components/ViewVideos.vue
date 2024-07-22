<template>
    <div class="columns-4">
      <div v-for="video in videos" :key="video._id" class="video-item break-inside-avoid">
        <video width="320" height="240" controls class="shadow-lg shadow-[#6e6d6d] rounded m-1">
          <source :src="`http://34.131.212.163/${video.videoPath}`" type="video/webm">
        </video>
        <p class="flex justify-center"> {{ video.description }}</p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import axios from 'axios';
  
  const videos = ref([]);
  
  const fetchVideos = async () => {
    try {
      const response = await axios.get('http://34.131.212.163/videos');
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
  