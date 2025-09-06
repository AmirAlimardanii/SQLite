import { createApp } from "vue";
import App from "./App.vue";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then((reg) => {
    console.log("SW registered:", reg);
  });
}

const app = createApp(App);

app.mount("#app");
