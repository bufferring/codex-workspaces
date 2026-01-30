/// <reference lib="WebWorker" />
/// <reference lib="ESNext" />

declare let self: ServiceWorkerGlobalScope;

import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
