import { defineWorkflow } from '#state';
import {
  captureScreen,
  captureTrack,
  checkScreenCaptureSupport,
  currentTime,
  generateId,
} from './activities';

/** Starts a recording session. Acquires screen capture, returns tracks and start time. */
export const startRecordingWorkflow = defineWorkflow((ctx) => {
  const tracks = ctx.run(captureScreen);
  const startedAt = ctx.run(currentTime);
  return { tracks, startedAt };
});

/** Stops the recording session. Takes elapsed seconds, produces recording metadata. */
export const stopRecordingWorkflow = defineWorkflow((ctx, elapsed: number) => {
  const id = ctx.run(generateId);
  const stoppedAt = ctx.run(currentTime);
  return { id, elapsed, stoppedAt };
});

/** Pauses the recording session. */
export const pauseRecordingWorkflow = defineWorkflow(() => {});

/** Resumes the recording session from a paused state. */
export const resumeRecordingWorkflow = defineWorkflow(() => {});

/** Adds a media track to the active session. */
export const addTrackWorkflow = defineWorkflow(
  (ctx, type: 'microphone' | 'tab') => ctx.run(captureTrack, type),
);

/** Removes a track from the active session by ID. */
export const removeTrackWorkflow = defineWorkflow(
  (_, trackId: string) => trackId,
);

/** Checks browser support for screen capture. Returns true if supported. */
export const checkSupportWorkflow = defineWorkflow((ctx) =>
  ctx.run(checkScreenCaptureSupport),
);
