import { createRouter, createWebHistory } from 'vue-router'
import Signup from './components/signup.vue'
import Login from './components/login.vue'
import ViewVideos from './components/ViewVideos.vue';
import RecordVideos from './components/RecordVideos.vue';

const routes = [
  { path: '/signup', component: Signup },
  { path: '/login', component: Login },
  { path: '/view-videos', component: ViewVideos },
  { path: '/record-videos', component: RecordVideos },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
