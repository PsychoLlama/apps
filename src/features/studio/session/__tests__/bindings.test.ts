import { vi } from 'vitest';
import { bindRegistry, createRegistry } from '#state';
import { libraryStore } from '../../library/store';
import { timerStore } from '../../timer/store';
import * as capabilities from '../capabilities';
import type { RecordingResult } from '../capabilities';
import {
  addTrackEffect,
  appendTrack,
  beginPause,
  beginRecording,
  beginResume,
  beginStop,
  checkSupportEffect,
  finalizeRecording,
  markError,
  markUnsupportedIf,
  removeTrackFromState,
  setRecordingContext,
  startRecordingEffect,
} from '../bindings';
import { sessionStore } from '../store';
import type { Track } from '../types';

vi.mock('../capabilities', async () => {
  const actual = await vi.importActual<typeof capabilities>('../capabilities');
  return {
    ...actual,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    pauseRecording: vi.fn(),
    resumeRecording: vi.fn(),
    captureTrack: vi.fn(),
    stopTrackStream: vi.fn(),
    checkSupport: vi.fn(),
  };
});

function setup() {
  const bound = bindRegistry(createRegistry());
  return {
    ...bound,
    session: bound.createStore(sessionStore),
    timer: bound.createStore(timerStore),
    library: bound.createStore(libraryStore),
  };
}

function makeResult(tracks: Track[] = []): RecordingResult {
  return {
    tracks,
    streams: Object.fromEntries(tracks.map((t) => [t.id, {} as MediaStream])),
    recorder: {} as MediaRecorder,
    chunks: [] as Blob[],
  };
}

beforeEach(() => {
  vi.mocked(capabilities.startRecording).mockReset();
  vi.mocked(capabilities.stopRecording).mockReset();
  vi.mocked(capabilities.captureTrack).mockReset();
  vi.mocked(capabilities.stopTrackStream).mockReset();
  vi.mocked(capabilities.checkSupport).mockReset();
});

// Effects whose callbacks close over module-level `session` (bound to
// GLOBAL_REGISTRY) can't satisfy their reads against a per-test
// registry. For those, we test the lifecycle actions directly; the
// effect/action wiring is smoke-tested against the real app.

describe('actions', () => {
  describe('beginRecording', () => {
    it('transitions to recording and resets the timer', () => {
      const { session, timer, useAction } = setup();

      useAction(beginRecording)();

      expect(session.status).toBe('recording');
      expect(session.error).toBeNull();
      expect(timer.running).toBe(true);
      expect(timer.elapsed).toBe(0);
    });

    it('clears previous error', () => {
      const { session, useAction } = setup();
      useAction(markError)(new Error('earlier'));

      useAction(beginRecording)();

      expect(session.error).toBeNull();
    });
  });

  describe('setRecordingContext', () => {
    it('populates tracks and wraps recorder / chunks / streams in refs', () => {
      const { session, useAction } = setup();
      const result = makeResult([
        { id: '1', type: 'screen', label: 'Screen', live: true },
      ]);

      useAction(setRecordingContext)(result);

      expect(session.tracks).toEqual(result.tracks);
      expect(session.recorder?.current).toBe(result.recorder);
      expect(session.chunks?.current).toBe(result.chunks);
      expect(session.streams['1']?.current).toBe(result.streams['1']);
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
    it('transitions to idle, clears tracks, stops timer — preserves refs', () => {
      const { session, timer, useAction } = setup();
      const result = makeResult([
        { id: '1', type: 'screen', label: 'Screen', live: true },
      ]);
      useAction(setRecordingContext)(result);
      useAction(beginRecording)();

      useAction(beginStop)();

      expect(session.status).toBe('idle');
      expect(session.tracks).toEqual([]);
      expect(timer.running).toBe(false);
      expect(session.recorder?.current).toBe(result.recorder);
      expect(session.chunks?.current).toBe(result.chunks);
    });
  });

  describe('finalizeRecording', () => {
    it('clears refs and appends the recording to the library', () => {
      const { session, library, useAction } = setup();
      useAction(setRecordingContext)(makeResult());

      useAction(finalizeRecording)({
        id: 'rec-1',
        elapsed: 45,
        stoppedAt: 2000,
        url: 'blob:test',
      });

      expect(session.recorder).toBeNull();
      expect(session.chunks).toBeNull();
      expect(session.streams).toEqual({});
      expect(library.recordings).toEqual([
        {
          id: 'rec-1',
          name: 'Recording 1',
          duration: 45,
          createdAt: 2000,
          url: 'blob:test',
        },
      ]);
    });
  });

  describe('beginPause', () => {
    it('transitions to paused and freezes the timer', () => {
      const { session, timer, useAction } = setup();
      useAction(beginRecording)();

      useAction(beginPause)();

      expect(session.status).toBe('paused');
      expect(timer.running).toBe(false);
    });
  });

  describe('beginResume', () => {
    it('transitions to recording and restarts the timer', () => {
      const { session, timer, useAction } = setup();
      useAction(beginRecording)();
      useAction(beginPause)();

      useAction(beginResume)();

      expect(session.status).toBe('recording');
      expect(timer.running).toBe(true);
    });
  });

  describe('appendTrack', () => {
    it('appends the track and wraps the stream in a ref', () => {
      const { session, useAction } = setup();
      const stream = {} as MediaStream;
      const track: Track = {
        id: '3',
        type: 'microphone',
        label: 'Mic',
        live: true,
      };

      useAction(appendTrack)({ track, stream });

      expect(session.tracks).toEqual([track]);
      expect(session.streams['3']?.current).toBe(stream);
    });
  });

  describe('removeTrackFromState', () => {
    it('removes the track and drops its stream ref', () => {
      const { session, useAction } = setup();
      useAction(setRecordingContext)(
        makeResult([
          { id: '1', type: 'screen', label: 'Screen', live: true },
          { id: '2', type: 'microphone', label: 'Mic', live: true },
        ]),
      );

      useAction(removeTrackFromState)('1');

      expect(session.tracks).toHaveLength(1);
      expect(session.tracks[0].id).toBe('2');
      expect(session.streams['1']).toBeUndefined();
    });

    it('is a no-op on an unknown id', () => {
      const { session, useAction } = setup();
      useAction(setRecordingContext)(
        makeResult([{ id: '1', type: 'screen', label: 'Screen', live: true }]),
      );

      useAction(removeTrackFromState)('nope');

      expect(session.tracks).toHaveLength(1);
    });
  });

  describe('markUnsupportedIf', () => {
    it('transitions to unsupported when false', () => {
      const { session, useAction } = setup();

      useAction(markUnsupportedIf)(false);

      expect(session.status).toBe('unsupported');
    });

    it('stays idle when true', () => {
      const { session, useAction } = setup();

      useAction(markUnsupportedIf)(true);

      expect(session.status).toBe('idle');
    });
  });
});

// Effects whose callbacks do NOT close over `session` can be exercised
// end-to-end against a per-test registry. The capability is mocked;
// onStart / onSuccess / onFailure are verified through state.

describe('startRecordingEffect', () => {
  it('onStart runs before the capability resolves', () => {
    vi.mocked(capabilities.startRecording).mockImplementation(
      () => new Promise(() => undefined),
    );
    const { session, timer, useEffect } = setup();

    void useEffect(startRecordingEffect)(() => undefined);

    expect(session.status).toBe('recording');
    expect(timer.running).toBe(true);
  });

  it('onSuccess populates context', async () => {
    const result = makeResult([
      { id: '1', type: 'screen', label: 'Screen', live: true },
    ]);
    vi.mocked(capabilities.startRecording).mockResolvedValue(result);
    const { session, useEffect } = setup();

    await useEffect(startRecordingEffect)(() => undefined);

    expect(session.tracks).toEqual(result.tracks);
    expect(session.recorder?.current).toBe(result.recorder);
  });

  it('onFailure surfaces the error', async () => {
    vi.mocked(capabilities.startRecording).mockRejectedValue(
      new Error('Permission denied'),
    );
    const { session, useEffect } = setup();

    await useEffect(startRecordingEffect)(() => undefined);

    expect(session.status).toBe('error');
    expect(session.error).toBe('Permission denied');
  });
});

describe('addTrackEffect', () => {
  it('onSuccess appends the captured track', async () => {
    const stream = {} as MediaStream;
    const track: Track = {
      id: '3',
      type: 'microphone',
      label: 'Mic',
      live: true,
    };
    vi.mocked(capabilities.captureTrack).mockResolvedValue({ track, stream });
    const { session, useEffect } = setup();

    await useEffect(addTrackEffect)('microphone');

    expect(session.tracks).toEqual([track]);
    expect(session.streams['3']?.current).toBe(stream);
  });
});

describe('checkSupportEffect', () => {
  it('transitions to unsupported when the capability returns false', () => {
    vi.mocked(capabilities.checkSupport).mockReturnValue(false);
    const { session, useEffect } = setup();

    useEffect(checkSupportEffect)();

    expect(session.status).toBe('unsupported');
  });

  it('stays idle when the capability returns true', () => {
    vi.mocked(capabilities.checkSupport).mockReturnValue(true);
    const { session, useEffect } = setup();

    useEffect(checkSupportEffect)();

    expect(session.status).toBe('idle');
  });
});
