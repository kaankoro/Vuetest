<template>
  <Header />
  <div class="sidebar">
    <router-link to="/record-videos">Record Videos</router-link>
    <router-link to="/view-videos">View Videos</router-link>
  </div>
  <div class="wrapper">
    <router-view></router-view>
  </div>
  <Footer />
</template>

<script setup>
import Header from './components/header.vue'
import Footer from './components/footer.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped>
header {
  line-height: 1.5;
}

.sidebar {
  width: 200px;
  float: left;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
