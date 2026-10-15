import * as lifecycle from './lifecycle';
import { servers } from './servers';

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('install', (event) => {
  event.waitUntil(lifecycle.install());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(lifecycle.activate());
});

self.addEventListener('fetch', (event) => {
  const { origin } = new URL(event.request.url);
  const serve = servers.get(origin);

  // Not an origin we serve.
  if (serve === undefined) return;

  event.respondWith(serve(event.request));
});
