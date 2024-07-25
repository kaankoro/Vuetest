<template>
  <div class="container mx-auto p-4">
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div v-for="video in videos" :key="video._id" class="video-item">
        <div class="aspect-w-16 aspect-h-9">
          <video controls class="w-full h-full object-cover rounded shadow-lg shadow-[#6e6d6d]">
            <source :src="`${connectionLink}/${video.videoPath}`" type="video/webm">
          </video>
        </div>
        <p class="mt-2 text-center text-gray-700">{{ video.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const videos = ref([]);
const connectionLink = import.meta.env.VITE_CONNECTION_LINK;

const fetchVideos = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_CONNECTION_LINK}/videos`);
    videos.value = response.data;
  } catch (error) {
    console.error(error);
  }
};

onMounted(fetchVideos);
</script>

<style scoped>
.video-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
