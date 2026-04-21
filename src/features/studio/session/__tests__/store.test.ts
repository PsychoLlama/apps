import { ref } from '#state';
import { bindRegistry, createRegistry, createStore } from '#state';
import { libraryStore } from '../../library/store';
import { timerStore } from '../../timer/store';
import {
  appendTrack,
  beginPause,
  beginRecording,
  beginResume,
  beginStop,
  finalizeRecording,
  markError,
  markUnsupportedIf,
  removeTrackFromState,
  setRecordingContext,
} from '../actions';
import { sessionStore } from '../store';
import type { Track } from '../types';

function setup() {
  const registry = createRegistry();
  const bound = bindRegistry(registry);
  createStore(registry, sessionStore);
  createStore(registry, timerStore);
  createStore(registry, libraryStore);
  return {
    ...bound,
    session: bound.useStore(sessionStore),
    timer: bound.useStore(timerStore),
    library: bound.useStore(libraryStore),
  };
}

const fakeTracks: Track[] = [
  { id: '1', type: 'screen', label: 'Screen', live: true },
  { id: '2', type: 'system-audio', label: 'Audio', live: true },
];

function context(tracks: Track[] = fakeTracks) {
  return {
    tracks,
    streams: Object.fromEntries(
      tracks.map((t) => [t.id, ref({} as MediaStream)]),
    ),
    recorder: ref({} as MediaRecorder),
    chunks: ref([] as Blob[]),
  };
}

describe('session actions', () => {
  it('session starts idle', () => {
    const { session } = setup();

    expect(session.status).toBe('idle');
    expect(session.tracks).toEqual([]);
    expect(session.error).toBeNull();
  });

  describe('beginRecording', () => {
    it('transitions session to recording and resets the timer', () => {
      const { session, timer, useAction } = setup();

      useAction(beginRecording)(undefined);

      expect(session.status).toBe('recording');
      expect(session.error).toBeNull();
      expect(timer.running).toBe(true);
      expect(timer.elapsed).toBe(0);
    });

    it('clears any previous error', () => {
      const { session, useAction } = setup();
      useAction(markError)(new Error('earlier'));

      useAction(beginRecording)(undefined);

      expect(session.error).toBeNull();
    });
  });

  describe('setRecordingContext', () => {
    it('populates tracks, streams, recorder, chunks', () => {
      const { session, useAction } = setup();
      const ctx = context();

      useAction(setRecordingContext)(ctx);

      expect(session.tracks).toEqual(fakeTracks);
      expect(session.streams['1']).toBe(ctx.streams['1']);
      expect(session.recorder).toBe(ctx.recorder);
      expect(session.chunks).toBe(ctx.chunks);
    });
  });

  describe('markError', () => {
    it('sets status and error message', () => {
      const { session, useAction } = setup();

      useAction(markError)(new Error('Permission denied'));

      expect(session.status).toBe('error');
      expect(session.error).toBe('Permission denied');
    });
  });

  describe('beginStop', () => {
    it('transitions session to idle, clears tracks, stops timer', () => {
      const { session, timer, useAction } = setup();
      useAction(beginRecording)(undefined);
      useAction(setRecordingContext)(context());

      useAction(beginStop)(undefined);

      expect(session.status).toBe('idle');
      expect(session.tracks).toEqual([]);
      expect(timer.running).toBe(false);
    });

    it('preserves refs so the stop effect can still reach them', () => {
      const { session, useAction } = setup();
      const ctx = context();
      useAction(setRecordingContext)(ctx);

      useAction(beginStop)(undefined);

      expect(session.recorder).toBe(ctx.recorder);
      expect(session.chunks).toBe(ctx.chunks);
    });
  });

  describe('finalizeRecording', () => {
    it('clears refs and appends the recording to the library', () => {
      const { session, library, useAction } = setup();
      useAction(setRecordingContext)(context());

      useAction(finalizeRecording)({
        id: 'rec-1',
        elapsed: 45,
        stoppedAt: 2000,
        url: 'blob:test',
      });

      expect(session.streams).toEqual({});
      expect(session.recorder).toBeNull();
      expect(session.chunks).toBeNull();
      expect(library.recordings).toHaveLength(1);
      expect(library.recordings[0]).toEqual({
        id: 'rec-1',
        name: 'Recording 1',
        duration: 45,
        createdAt: 2000,
        url: 'blob:test',
      });
    });
  });

  describe('beginPause', () => {
    it('pauses session and freezes the timer', () => {
      const { session, timer, useAction } = setup();
      useAction(beginRecording)(undefined);

      useAction(beginPause)(undefined);

      expect(session.status).toBe('paused');
      expect(timer.running).toBe(false);
    });
  });

  describe('beginResume', () => {
    it('resumes session and restarts the timer', () => {
      const { session, timer, useAction } = setup();
      useAction(beginRecording)(undefined);
      useAction(beginPause)(undefined);

      useAction(beginResume)(undefined);

      expect(session.status).toBe('recording');
      expect(timer.running).toBe(true);
    });
  });

  describe('appendTrack', () => {
    it('adds a track and stores its stream ref', () => {
      const { session, useAction } = setup();
      const streamRef = ref({} as MediaStream);
      const track: Track = {
        id: '3',
        type: 'microphone',
        label: 'Mic',
        live: true,
      };

      useAction(appendTrack)({ track, streamRef });

      expect(session.tracks).toEqual([track]);
      expect(session.streams['3']).toBe(streamRef);
    });
  });

  describe('removeTrackFromState', () => {
    it('removes a track by id and drops its stream ref', () => {
      const { session, useAction } = setup();
      useAction(setRecordingContext)(
        context([
          { id: '1', type: 'screen', label: 'Screen', live: true },
          { id: '2', type: 'microphone', label: 'Mic', live: true },
        ]),
      );

      useAction(removeTrackFromState)('1');

      expect(session.tracks).toEqual([
        { id: '2', type: 'microphone', label: 'Mic', live: true },
      ]);
      expect(session.streams['1']).toBeUndefined();
    });

    it('is a no-op when the id is unknown', () => {
      const { session, useAction } = setup();
      useAction(setRecordingContext)(
        context([{ id: '1', type: 'screen', label: 'Screen', live: true }]),
      );

      useAction(removeTrackFromState)('unknown');

      expect(session.tracks).toHaveLength(1);
    });
  });

  describe('markUnsupportedIf', () => {
    it('transitions to unsupported when called with false', () => {
      const { session, useAction } = setup();

      useAction(markUnsupportedIf)(false);

      expect(session.status).toBe('unsupported');
    });

    it('stays idle when called with true', () => {
      const { session, useAction } = setup();

      useAction(markUnsupportedIf)(true);

      expect(session.status).toBe('idle');
    });
  });

  describe('full lifecycle', () => {
    it('idle → recording → paused → recording → idle', () => {
      const { session, useAction } = setup();

      expect(session.status).toBe('idle');

      useAction(beginRecording)(undefined);
      expect(session.status).toBe('recording');

      useAction(beginPause)(undefined);
      expect(session.status).toBe('paused');

      useAction(beginResume)(undefined);
      expect(session.status).toBe('recording');

      useAction(beginStop)(undefined);
      expect(session.status).toBe('idle');
    });
  });
});
