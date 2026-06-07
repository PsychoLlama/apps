import { createStore, defineStore, type Ref } from '@lib/state';
import type { Scan } from '@lib/qr-scanner';

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

/**
 * Torch (camera flash) control for the live stream. Populated when a
 * stream goes live; only Android Chromium exposes a controllable torch
 * today, so `supported` stays false everywhere else and the UI hides the
 * control rather than offering a dead button.
 */
export interface TorchState {
  /** Whether the active camera exposes a controllable torch. */
  supported: boolean;
  /** Whether the torch is currently lit. */
  on: boolean;
}

/**
 * A decoded barcode, mirrored into state on recognition. Derived from
 * `@lib/qr-scanner`'s {@link Scan} so the two can't drift — but picked
 * down to its plain data fields. `Scan` itself is a wasm handle (it owns
 * `free()` and can't cross a `postMessage` boundary), so it stays in the
 * worker; what we surface is this structured-clone-safe projection.
 */
export type ScanResult = Pick<Scan, 'text' | 'format'>;

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
  /** Torch availability and state for the live stream. */
  torch: TorchState;
  /**
   * The decoder worker once it's spawned and its wasm module is live,
   * else `null`. Preloaded on page mount and outlives individual camera
   * sessions. Held behind a {@link Ref} so the reactive store doesn't
   * proxy the host {@link Worker}.
   */
  decoder: Ref<Worker> | null;
  /**
   * The most recently recognized code, or `null` before the first hit.
   * Set once per session — the capture loop stops after recording.
   */
  result: ScanResult | null;
  /**
   * Monotonic request counter, bumped whenever a request starts or is
   * aborted. An in-flight `getUserMedia` captures the value at the start
   * and re-checks it once the prompt resolves — a mismatch means it was
   * superseded (e.g. the user navigated away mid-prompt), so the
   * resolved stream is stopped instead of stored. Latest-wins.
   */
  generation: number;
}

export const scannerStore = defineStore<ScannerState>(() => ({
  status: 'idle',
  stream: null,
  error: null,
  torch: { supported: false, on: false },
  decoder: null,
  result: null,
  generation: 0,
}));

/** Live, readonly view of the camera session. */
export const scanner = createStore(scannerStore);
