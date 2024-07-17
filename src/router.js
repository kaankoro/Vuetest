import { createRouter, createWebHistory } from 'vue-router'
import Signup from './components/signup.vue'
import Login from './components/login.vue'
import ViewVideos from './components/ViewVideos.vue';
import RecordVideos from './components/RecordVideos.vue';
import Home from './components/home.vue';

const routes = [  
  { path: '/', component: Home },
  { path: '/signup', component: Signup },
  { path: '/login', component: Login },
  { path: '/view-videos', name: 'View', component: ViewVideos },
  { path: '/record-videos', name: 'Record', component: RecordVideos },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
