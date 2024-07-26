import { createRouter, createWebHistory } from "vue-router";
import ViewVideos from "./pages/ViewVideos.vue";
import RecordVideos from "./pages/RecordVideos.vue";
import Home from "./pages/AppHome.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/view-videos", name: "View", component: ViewVideos },
  { path: "/record-videos", name: "Record", component: RecordVideos },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
