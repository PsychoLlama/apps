import { createStore, defineStore, type Ref } from '@lib/state';
import type { DecoderConnection } from './decoder';

/**
 * The decoder worker's lifecycle, kept apart from the camera session it
 * serves. The worker is preloaded once on page mount, outlives individual
 * camera sessions, and is torn down only on unmount — a longer-lived concern
 * than a session's start/stop churn, so it owns its own store rather than
 * riding along in the camera state.
 */
export interface DecoderState {
  /**
   * The decoder worker and its RPC binding once spawned and the wasm module
   * is live, else `null`. Held behind a {@link Ref} so the reactive store
   * doesn't proxy the host {@link Worker} or its RPC.
   */
  connection: Ref<DecoderConnection> | null;
  /**
   * Monotonic counter for the decoder preload, bumped on teardown. The async
   * `createDecoder` captures it at spawn and re-checks once the worker is
   * ready: a mismatch means the scanner tore down mid-preload, so the
   * resolved worker is terminated rather than attached — no orphaned worker
   * outlives the page.
   */
  generation: number;
}

export const decoderStore = defineStore<DecoderState>(() => ({
  connection: null,
  generation: 0,
}));

/** Live, readonly view of the decoder worker connection. */
export const decoder = createStore(decoderStore);
