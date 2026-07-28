import {
  defineCell,
  defineFold,
  defineStore,
  defineTopic,
} from '@lib/state-next';
import { stopStream } from './capabilities';
import { scannerScope } from './scope';
import type { ScanResult } from '../worker/rpc';

/**
 * Lifecycle of the camera session backing the scanner.
 *
 * - `idle` — no stream; the landing page invites the user to start, or the
 *   result surface shows what the last session recognized.
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

/** Camera session state for the scanner. */
export interface CameraState {
  /** Where the session sits in its lifecycle. */
  status: ScannerStatus;
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

/** Lifecycle of the scanner's camera session. */
export const cameraStore = defineStore<CameraState>(scannerScope, () => ({
  status: 'idle',
  error: null,
  torch: idleTorch(),
  result: null,
}));

/**
 * The live camera stream while `status === 'streaming'`, else `null`. A
 * cell, not store state — the `<video>` element needs the real
 * `MediaStream`, and a reactive store would hand it a proxy.
 *
 * Dropping it stops every track, which is what releases the camera (and its
 * recording indicator) when the last anchor goes away.
 */
export const streamCell = defineCell<MediaStream | null>(
  scannerScope,
  () => null,
  { drop: stopStream },
);

/** A live feed, paired with what its camera turned out to be capable of. */
export interface LiveCamera {
  /** The live stream to render and sample frames from. */
  stream: MediaStream;
  /** Whether the stream's camera exposes a controllable torch. */
  torch: boolean;
}

/**
 * A camera request got under way. Clears the prior error and result so
 * "scan again" and "try again" both start from a clean slate.
 */
export const scanRequestedTopic = defineTopic();
defineFold(scanRequestedTopic, [cameraStore], (camera) => {
  camera.status = 'requesting';
  camera.error = null;
  camera.result = null;
});

/** The camera opened; the feed is live and its torch support is known. */
export const cameraOpenedTopic = defineTopic<LiveCamera>();
defineFold(
  cameraOpenedTopic,
  [cameraStore, streamCell],
  (camera, held, live) => {
    camera.status = 'streaming';
    camera.error = null;
    camera.torch = { supported: live.torch, on: false };
    held.current = live.stream;
  },
);

/** The camera request failed, with the cause normalized for the UI. */
export const cameraFailedTopic = defineTopic<CameraErrorKind>();
defineFold(
  cameraFailedTopic,
  [cameraStore, streamCell],
  (camera, held, kind) => {
    camera.status = 'error';
    camera.error = kind;
    camera.torch = idleTorch();
    camera.result = null;
    held.current = null;
  },
);

/**
 * The torch's new state, as confirmed by the hardware. Only committed once
 * `applyConstraints` resolves, so a rejected toggle leaves the button
 * reflecting reality.
 */
export const torchToggledTopic = defineTopic<boolean>();
defineFold(torchToggledTopic, [cameraStore], (camera, on) => {
  camera.torch.on = on;
});

/**
 * The feed was dismissed and the camera released. Back to the landing
 * state, with no result to park on.
 */
export const scanStoppedTopic = defineTopic();
defineFold(scanStoppedTopic, [cameraStore, streamCell], (camera, held) => {
  camera.status = 'idle';
  camera.error = null;
  camera.torch = idleTorch();
  camera.result = null;
  held.current = null;
});

/**
 * A code was recognized. The stream is already stopped by the time this
 * lands, so the session drops it and returns to idle *keeping* the result —
 * which is what swaps the result surface in for the feed.
 */
export const codeRecognizedTopic = defineTopic<ScanResult>();
defineFold(
  codeRecognizedTopic,
  [cameraStore, streamCell],
  (camera, held, result) => {
    camera.status = 'idle';
    camera.torch = idleTorch();
    camera.result = result;
    held.current = null;
  },
);
