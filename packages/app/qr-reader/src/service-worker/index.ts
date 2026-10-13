import * as lifecycle from './lifecycle';
import { routers } from './routers';

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('install', (event) => {
  event.waitUntil(lifecycle.install());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(lifecycle.activate());
});

self.addEventListener('fetch', (event) => {
  const { origin } = new URL(event.request.url);
  const router = routers[origin];

  // Not an origin we serve.
  if (router === undefined) return;

  event.respondWith(router.fetch(event.request));
});
