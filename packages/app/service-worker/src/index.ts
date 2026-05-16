/**
 * POC service worker. Activates immediately on install/upgrade and
 * intercepts `/api/local/health` to short-circuit a JSON response.
 * Everything else falls through to the network.
 *
 * Consumed by `@app/main` via Vite's `?worker&url` import — the host
 * bundles this module and registers the resulting URL.
 */

import { createLogger } from '@lib/observability';
import helloWasmUrl from '@wasm/hello/wasm?url';

declare const self: ServiceWorkerGlobalScope;

interface HelloExports {
  memory: WebAssembly.Memory;
  message_ptr(): number;
  message_len(): number;
}

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

self.addEventListener('install', (event) => {
  // The app holds no SW-version-coupled state (no precaches keyed to
  // a build, no in-flight IndexedDB migrations), so a new SW can
  // displace its predecessor without waiting for old tabs to close.
  // Revisit this once we cache anything stateful.
  void self.skipWaiting();

  // First wasm consumer — proves the Cargo → vite pipeline reaches
  // the SW runtime. The crate exposes the message via two `extern "C"`
  // accessors so the JS side reads it straight out of linear memory,
  // skipping the wasm-bindgen glue.
  event.waitUntil(
    WebAssembly.instantiateStreaming(fetch(helloWasmUrl)).then(
      ({ instance }) => {
        const exports = instance.exports as unknown as HelloExports;
        const bytes = new Uint8Array(
          exports.memory.buffer,
          exports.message_ptr(),
          exports.message_len(),
        );
        logger.info(new TextDecoder().decode(bytes));
      },
    ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname !== '/api/local/health') return;

  event.respondWith(Response.json({ status: 'online' }));
});
