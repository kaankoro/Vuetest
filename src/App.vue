<template>
  <div class="flex flex-col h-screen">
    <div class="bg-[#d98740] mb-2">
  <Header class="text-2xl grid justify-center"/>
  <div class="flex align-top gap-2 justify-center mb-2">
    <router-link class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l" to="/">Main Page</router-link>
    <router-link class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l" to="/record-videos">Record Videos</router-link>
    <router-link class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l" to="/view-videos">View Videos</router-link>
  </div>
</div>
  <div>
    <router-view></router-view>
  </div>
  <Footer class="grid justify-center" />
</div>
</template>

<script setup>
import Header from './components/header.vue'
import Footer from './components/footer.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped>

</style>
