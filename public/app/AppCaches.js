let PostCaches = [];
let CacheOnly = [];
let CacheFirst = ["/sql-wasm.wasm"];
let NetworkOnly = [];
let NetworkFirst = [];
let runtimeCache = ["/sql-wasm.wasm"];
const AppUlr = "//simmab-ir/";
const StaticCache = "StaticCache-v1.01";
const DynamicCache = "DynamicCache-v1.01";
const MediaCache = "MediaCache-v1.01";
const MapCache = "MapCache-v1.01";
const JsonCache = "JsonCache-v1.01";
const AssetsCache = {
  image: "ImageCache-v1.01",
  // style: 'StyleCache-v1.0',
  // script: 'ScriptCache-v1.0',
  font: "FontCache-v1.01",
};
const cacheList = [
  StaticCache,
  DynamicCache,
  MapCache,
  MediaCache,
  AssetsCache["image"],
  AssetsCache["style"],
  AssetsCache["script"],
  AssetsCache["font"],
  AssetsCache["json"],
];

const AppCaches = {
  init() {
    self.addEventListener("install", (event) => {
      console.log("install");

      if (this.installApp) {
        event.waitUntil(
          Promise.resolve(this.installApp()).catch((err) => {
            console.error("Install app failed:", err);
            return Promise.resolve();
          })
        );
      }

      self.skipWaiting();
    });

    self.addEventListener("activate", (event) => {
      console.log("activate");

      event.waitUntil(this.activateApp());
    });

    self.addEventListener("fetch", (event) => {
      event.respondWith(this.fetchApp(event.request));
    });
  },

  async installApp() {
    navigator.serviceWorker?.ready.then((registration) => {
      if (registration.active) {
        console.log("State:", registration.active.state);
        registration.active.addEventListener("statechange", (e) => {
          console.log("New state:", e.target.state);
        });
      } else {
        console.log("No active service worker");
      }
    });

    if (!self?.location?.href.includes(AppUlr)) {
      let cache = await caches.open(StaticCache);
      if (cache) {
        return await cache.addAll(runtimeCache);
      }
    }
  },
  // Activate Event
  async activateApp() {
    let keys = await caches.keys();
    if (keys)
      return await Promise.all(
        keys
          .filter((key) => !cacheList.includes(key))
          .map(function (key) {
            return caches.delete(key);
          })
      );
  },
  async AssetsCacheFunction(request, search = true, cache_name = null, network_only = false) {
    let CacheName = cache_name || AssetsCache[request.destination];
    let response = await caches.match(request, {
      ignoreVary: true,
      ignoreSearch: search,
    });
    if (response) return response;
    try {
      let networkResponse = await fetch(request);
      if (networkResponse && [0, 200].includes(networkResponse.status)) {
        if (!network_only && CacheName) {
          let cache = await caches.open(CacheName);
          if (cache) await cache.put(request, networkResponse.clone());
        }
      }
      return networkResponse;
    } catch (e) {}
    p;
  },
  async fetchApp(request) {
    if (request.url.includes("extension") || !(request.url.indexOf("http") === 0)) return;
    if (request.url.includes(AppUlr)) return await fetch(request);
    let pathname = new URL(request.url).pathname;
    console.log("path name", pathname);

    let keys = Object.keys(AssetsCache);
    let isMedia = ["video", "audio"].includes(request.destination) && request.method === "GET";
    let openstreetmap = request.url.includes("openstreetmap.org");
    let isEncryptDB = request.url.includes("/src/wells/");
    let uiAvatars = request.url.includes("ui-avatars.com");
    let jsonFile =
      request.url.toLowerCase().endsWith(".json") || request.url.toLowerCase().endsWith(".geojson");
    let IsNavigate =
      request.credentials === "include" &&
      request.destination === "document" &&
      request.method === "GET" &&
      request.mode === "navigate";
    if (openstreetmap) {
      return await this.AssetsCacheFunction(
        request,
        true,
        MapCache,
        Setting.MapCached === "noCached"
      );
    } else if (jsonFile) {
      return await this.AssetsCacheFunction(request, true, JsonCache);
    } else if (isEncryptDB) {
      return await this.AssetsCacheFunction(request, true,   JsonCache);
    } else if (uiAvatars) {
      return await this.AssetsCacheFunction(request, false, AssetsCache["image"]);
    } else if (keys.includes(request.destination)) {
      return await this.AssetsCacheFunction(request);
    } else if (isMedia) {
      return (
        (await caches.match(request, {
          ignoreVary: true,
          ignoreSearch: true,
        })) || (await fetch(request))
      );
    }
    // else if (IsNavigate) {
    //     if (pathname.startsWith('/app')) {
    //         return await caches.match("/app/", {ignoreVary: true, ignoreSearch: true}) || await fetch("/app/")
    //     } else {
    //         return await fetch(request) || await caches.match(request, {ignoreVary: true, ignoreSearch: true})
    //     }
    // }
    return await fetch(request);
  },
};
