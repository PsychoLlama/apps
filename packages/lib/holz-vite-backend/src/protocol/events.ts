import type { SerializedLog } from './serialization.ts';

/**
 * Custom HMR event a browser sends over the Vite socket, carrying one
 * {@link SerializedLog} to the dev server.
 */
export const LOG_EVENT = '@holz/vite-backend:log';

// Types `hot.send(LOG_EVENT, …)` on the client and `hot.on(LOG_EVENT, …)` on
// the server against the same payload.
declare module 'vite/types/customEvent.d.ts' {
  interface CustomEventMap {
    [LOG_EVENT]: SerializedLog;
  }
}
