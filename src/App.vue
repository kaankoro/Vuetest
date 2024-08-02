<template>
    <link rel="preconnect" href="https://rsms.me/">
<link rel="stylesheet" href="https://rsms.me/inter/inter.css">
  <div class="flex flex-col h-screen">
    <div v-if="!isRecordVideosPage" class="bg-[#d98740] mb-2">
      <Header class="text-2xl grid justify-center" />
      <div class="flex align-top gap-2 justify-center mb-2">
        <router-link class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l" to="/">Main
          Page</router-link>
        <router-link class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"
          to="/record-videos">Record Videos</router-link>
        <router-link class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"
          to="/view-videos">View Videos</router-link>
      </div>
    </div>
    <div>
      <router-view></router-view>
    </div>
    <Footer v-if="!isRecordVideosPage" class="grid justify-center" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from './components/layout/AppHeader.vue'
import Footer from './components/layout/AppFooter.vue'

const route = useRoute()

const isRecordVideosPage = computed(() => route.path === '/record-videos')
</script>
