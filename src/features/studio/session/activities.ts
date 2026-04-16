import { defineActivity } from '#state';
import type { Track } from './types';

/** Stub: acquires screen capture. Would call getDisplayMedia in production. */
export const captureScreen = defineActivity({}, (): Track[] => [
  { id: '1', type: 'screen', label: 'Entire Screen', live: true },
  { id: '2', type: 'system-audio', label: 'System Audio', live: true },
]);

/** Stub: acquires an additional media track. */
export const captureTrack = defineActivity(
  {},
  (type: 'microphone' | 'tab'): Track => ({
    id: String(Date.now()),
    type,
    label: type === 'microphone' ? 'Microphone' : 'Browser Tab',
    live: true,
  }),
);

/** Returns the current timestamp. Isolates Date.now() for testability. */
export const currentTime = defineActivity({}, () => Date.now());

/** Generates a unique ID. Isolates crypto.randomUUID() for testability. */
export const generateId = defineActivity({}, () => crypto.randomUUID());

/** Checks whether the browser supports screen capture. */
export const checkScreenCaptureSupport = defineActivity(
  {},
  () =>
    typeof navigator !== 'undefined' &&
    'mediaDevices' in navigator &&
    'getDisplayMedia' in navigator.mediaDevices,
);
