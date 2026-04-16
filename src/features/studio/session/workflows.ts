import { defineWorkflow } from '#state';
import {
  captureScreen,
  captureTrack,
  checkScreenCaptureSupport,
  createBlobUrl,
  createRecorder,
  currentTime,
  generateId,
  pauseRecorder,
  removeMediaStream,
  resumeRecorder,
  stopRecorder,
  watchStreamEnd,
} from './activities';

/** Starts a recording session. Acquires screen capture, starts the recorder. */
export const startRecordingWorkflow = defineWorkflow(
  async (ctx, onStreamEnded: () => void) => {
    const tracks = await ctx.run(captureScreen);
    const startedAt = ctx.run(currentTime);
    ctx.run(createRecorder);

    const videoTrack = tracks.find((t) => t.type === 'screen');
    if (videoTrack) {
      ctx.run(watchStreamEnd, videoTrack.id, onStreamEnded);
    }

    return { tracks, startedAt };
  },
);

/** Stops the recording session. Produces a blob URL for download. */
export const stopRecordingWorkflow = defineWorkflow(
  async (ctx, elapsed: number) => {
    const blob = await ctx.run(stopRecorder);
    const url = ctx.run(createBlobUrl, blob);
    const id = ctx.run(generateId);
    const stoppedAt = ctx.run(currentTime);
    return { id, elapsed, stoppedAt, url };
  },
);

/** Pauses the recording session. */
export const pauseRecordingWorkflow = defineWorkflow((ctx) => {
  ctx.run(pauseRecorder);
});

/** Resumes the recording session from a paused state. */
export const resumeRecordingWorkflow = defineWorkflow((ctx) => {
  ctx.run(resumeRecorder);
});

/** Adds a media track to the active session. */
export const addTrackWorkflow = defineWorkflow(
  async (ctx, type: 'microphone' | 'tab') => ctx.run(captureTrack, type),
);

/** Removes a track from the active session by ID. */
export const removeTrackWorkflow = defineWorkflow((ctx, trackId: string) => {
  ctx.run(removeMediaStream, trackId);
  return trackId;
});

/** Checks browser support for screen capture. */
export const checkSupportWorkflow = defineWorkflow((ctx) =>
  ctx.run(checkScreenCaptureSupport),
);
