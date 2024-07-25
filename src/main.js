import { createApp } from "vue";
import App from "./App.vue";

import router from "./router";
import "./index.css";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

createApp(App).use(router).mount("#app");
