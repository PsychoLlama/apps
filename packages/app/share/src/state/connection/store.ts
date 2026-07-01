import { createStore, defineStore, type Ref } from '@lib/state';
import type { Connection } from '@crate/iroh';

/**
 * Where the browser's relay connection sits in its lifecycle.
 *
 * - `initial` — nothing attempted yet. The site is SSG'd and the wasm
 *   fetch + relay handshake are client-only, so this is what prerender and
 *   first paint show, and where a torn-down connection returns to.
 * - `connecting` — the wasm is instantiating and/or the relay handshake is
 *   in flight.
 * - `connected` — the endpoint is live on the relay network; `endpoint`
 *   holds it open.
 */
export type ConnectionStatus = 'initial' | 'connecting' | 'connected';

/** The browser's live membership in the iroh relay network. */
export interface ConnectionState {
  /** Where the connection sits in its lifecycle. */
  status: ConnectionStatus;
  /**
   * The live endpoint joined to the relay network, held for the lifetime of
   * the view so it stays reachable; dropping it tears the relay connection
   * down. `null` outside the `connected` state — including during SSG and
   * first paint, since the wasm is client-only. Held behind `Ref` so the
   * reactive store doesn't proxy the wasm handle.
   */
  endpoint: Ref<Connection> | null;
}

export const connectionStore = defineStore<ConnectionState>(() => ({
  status: 'initial',
  endpoint: null,
}));

/** Live, readonly view of the relay connection. */
export const connection = createStore(connectionStore);
