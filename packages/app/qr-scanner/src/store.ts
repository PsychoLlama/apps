import { createStore, defineStore, type Ref } from '@lib/state';

/**
 * Lifecycle of the camera session backing the scanner.
 *
 * - `idle` — no stream; the landing page invites the user to start.
 * - `requesting` — `getUserMedia` is in flight, awaiting the permission
 *   prompt and hardware spin-up.
 * - `streaming` — a live stream is attached and rendered full-viewport.
 * - `error` — the request failed; `error` carries the reason.
 */
export type ScannerStatus = 'idle' | 'requesting' | 'streaming' | 'error';

/**
 * Why a camera request failed, normalized from the browser's grab-bag
 * of `DOMException` names into the handful of cases the UI speaks to.
 */
export type CameraErrorKind =
  /** The user blocked the prompt, or permission is otherwise denied. */
  | 'permission-denied'
  /** No camera is attached, or none satisfies the constraints. */
  | 'no-camera'
  /** The browser/context can't reach `mediaDevices` at all. */
  | 'unsupported'
  /** Anything we don't specifically recognize. */
  | 'unknown';

/** Camera session state for the scanner. */
export interface ScannerState {
  /** Where the session sits in its lifecycle. */
  status: ScannerStatus;
  /**
   * The live camera stream while `streaming`, else `null`. Held behind a
   * {@link Ref} so the reactive store doesn't proxy the host object — the
   * `<video>` element needs the real `MediaStream`.
   */
  stream: Ref<MediaStream> | null;
  /** Failure reason while `status === 'error'`, else `null`. */
  error: CameraErrorKind | null;
}

export const scannerStore = defineStore<ScannerState>(() => ({
  status: 'idle',
  stream: null,
  error: null,
}));

/** Live, readonly view of the camera session. */
export const scanner = createStore(scannerStore);
