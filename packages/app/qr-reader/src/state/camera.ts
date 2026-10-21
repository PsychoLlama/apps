import { defineCommand, defineStore } from '@lib/state';
import type { ScanResult } from '../worker/rpc';

/**
 * Lifecycle of the camera session backing the reader.
 *
 * - `idle` — no stream; the landing page invites the user to start, or the
 *   result surface shows what the last session recognized.
 * - `requesting` — `getUserMedia` is in flight, awaiting the permission
 *   prompt and hardware spin-up.
 * - `streaming` — a live stream is attached and rendered full-viewport.
 * - `error` — the request failed; `error` carries the reason.
 */
export type ReaderStatus = 'idle' | 'requesting' | 'streaming' | 'error';

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

/** Camera session state for the reader. */
export interface CameraState {
  /** Where the session sits in its lifecycle. */
  status: ReaderStatus;
  /** Failure reason while `status === 'error'`, else `null`. */
  error: CameraErrorKind | null;
  /** Torch availability and state for the live stream. */
  torch: TorchState;
  /**
   * The most recently recognized code, or `null` before the first hit.
   * Set once per session — the capture loop stops after recording.
   */
  result: ScanResult | null;
}

/** A fresh torch state. Each session gets its own — the store mutates it. */
const idleTorch = (): TorchState => ({ supported: false, on: false });

/** Lifecycle of the reader's camera session. */
export const $camera = defineStore<CameraState>(() => ({
  status: 'idle',
  error: null,
  torch: idleTorch(),
  result: null,
}));

/**
 * Whether the session wants the camera: a request is under way or the feed
 * is live. Whoever holds the stream holds it for exactly this long.
 */
export const wantsCamera = (camera: { readonly status: ReaderStatus }) =>
  camera.status === 'requesting' || camera.status === 'streaming';

/**
 * A camera request got under way. Clears the prior error and result so
 * "scan again" and "try again" both start from a clean slate. Ignored while
 * the camera is already wanted, so a second tap can't restart a live feed.
 */
export const $scanRequested = defineCommand([$camera], (camera) => () => {
  if (wantsCamera(camera)) return;

  camera.status = 'requesting';
  camera.error = null;
  camera.result = null;
});

/**
 * The camera opened; the feed is live, and `torch` says whether its camera
 * has one to control.
 */
export const $cameraOpened = defineCommand(
  [$camera],
  (camera) => (torch: boolean) => {
    camera.status = 'streaming';
    camera.error = null;
    camera.torch = { supported: torch, on: false };
  },
);

/** The camera request failed, with the cause normalized for the UI. */
export const $cameraFailed = defineCommand(
  [$camera],
  (camera) => (kind: CameraErrorKind) => {
    camera.status = 'error';
    camera.error = kind;
    camera.torch = idleTorch();
    camera.result = null;
  },
);

/**
 * The torch's new state, as confirmed by the hardware. Only committed once
 * `applyConstraints` resolves, so a rejected toggle leaves the button
 * reflecting reality.
 */
export const $torchToggled = defineCommand(
  [$camera],
  (camera) => (on: boolean) => {
    camera.torch.on = on;
  },
);

/**
 * The feed was dismissed. Back to the landing state, with no result to park
 * on; the camera is released along with the session's want of it.
 */
export const $scanStopped = defineCommand([$camera], (camera) => () => {
  camera.status = 'idle';
  camera.error = null;
  camera.torch = idleTorch();
  camera.result = null;
});

/**
 * A code was recognized. The session returns to idle *keeping* the result,
 * which swaps the result surface in for the feed and releases the camera.
 */
export const $codeRecognized = defineCommand(
  [$camera],
  (camera) => (result: ScanResult) => {
    camera.status = 'idle';
    camera.torch = idleTorch();
    camera.result = result;
  },
);
