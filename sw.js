// // نصب
// self.addEventListener("install", (event) => {
//   console.log("✅ SW installed");
//   self.skipWaiting(); // سریع فعال بشه
// });

// // فعال شدن
// self.addEventListener("activate", (event) => {
//   console.log("✅ SW activated");
//   event.waitUntil(self.clients.claim()); // کنترل تب‌ها رو بگیره
// });

// // همه‌ی fetchها
// self.addEventListener("fetch", (event) => {
//   console.log("🌐 SW intercepting fetch:", event.request.url);

//   // فقط برای تست: بدون تغییر دادن پاسخ
//   event.respondWith(fetch(event.request));
// });

const Debug = false;

const Setting = {
  MapCached: "noCached",
  PageCached: "Cached",
  BGSynced: "noSynced",
};

(() => {
  "use strict";
  // importScripts("/app/js/dexie.min.js");
  // importScripts("/app/js/AppFirebaseNotification.js");
  importScripts("/app/AppCaches.js");
  // importScripts("/app/js/AppIndexedDB.js");
  // importScripts("/app/js/AppMessage.js");
  AppCaches.init();
  // AppIndexedDB.init();
  // AppFirebaseNotification.init();
  // AppMessage.init();
})();
