// import './assets/main.css'

import { createApp } from "vue";

import App from "./App.vue";

// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker
//       .register("/app/sw.js", { scope: "/app/" })
//       .then((reg) => console.log("SW registered with scope:", reg.scope))
//       .catch((err) => console.error("SW registration failed:", err));
//   });
// }

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then((reg) => {
    console.log("SW registered:", reg);
  });
}

const app = createApp(App);

app.mount("#app");
