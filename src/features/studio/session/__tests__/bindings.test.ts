import { vi } from 'vitest';
import { createTestBindings, defineAction } from '#state';
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
  markSupport,
  pauseRecordingEffect,
  removeTrackEffect,
  removeTrackFromState,
  resumeRecordingEffect,
  setRecordingContext,
  startRecordingEffect,
  stopRecordingEffect,
} from '../bindings';
import { sessionStore } from '../store';
import type { Track } from '../types';

vi.mock('../capabilities', async () => {
  const actual = await vi.importActual<typeof capabilities>('../capabilities');
  return {
    ...actual,
    startRecording: vi.fn(),
    captureTrack: vi.fn(),
    checkSupport: vi.fn(),
  };
});

function setup() {
  const bindings = createTestBindings();
  return {
    ...bindings,
    session: bindings.createStore(sessionStore),
    timer: bindings.createStore(timerStore),
    library: bindings.createStore(libraryStore),
  };
}

// Class-instance stubs so Solid's `createMutable` leaves them unproxied,
// matching the runtime behavior of real `MediaRecorder` / `MediaStream`.
class FakeRecorder {
  pause = vi.fn();
  resume = vi.fn();
  stop = vi.fn();
  mimeType = 'video/webm';
  addEventListener = vi.fn();
}
class FakeStream {
  tracks: Array<{ stop: () => void }>;
  constructor(tracks: Array<{ stop: () => void }> = []) {
    this.tracks = tracks;
  }
  getTracks(): Array<{ stop: () => void }> {
    return this.tracks;
  }
}

function makeResult(tracks: Track[] = []): RecordingResult {
  return {
    tracks,
    streams: Object.fromEntries(
      tracks.map((track) => [
        track.id,
        new FakeStream() as unknown as MediaStream,
      ]),
    ),
    recorder: new FakeRecorder() as unknown as MediaRecorder,
    chunks: [],
  };
}

// Internal helper: drive the session into a recording state with a
// controlled recorder mock so the pause/resume/stop effects have
// something to call into.
function arm(bindings: ReturnType<typeof setup>) {
  const recorder = new FakeRecorder();
  const trackStop = vi.fn();
  const stream = new FakeStream([{ stop: trackStop }]);

  // Mutate state directly via the test-only bootstrap action. Writing
  // through an action keeps state consistent with the reactive proxy.
  bindings.useAction(
    defineAction([sessionStore], (session) => {
      session.status = 'recording';
      session.tracks = [
        { id: '1', type: 'screen', label: 'Screen', live: true },
      ];
      session.streams = { '1': stream as unknown as MediaStream };
      session.recorder = recorder as unknown as MediaRecorder;
      session.chunks = [];
    }),
  )();
  return { recorder, stream, trackStop };
}

beforeEach(() => {
  vi.mocked(capabilities.startRecording).mockReset();
  vi.mocked(capabilities.captureTrack).mockReset();
  vi.mocked(capabilities.checkSupport).mockReset();
});

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
    it('populates tracks, recorder, chunks, and streams', () => {
      const { session, useAction } = setup();
      const result = makeResult([
        { id: '1', type: 'screen', label: 'Screen', live: true },
      ]);

      useAction(setRecordingContext)(result);

      expect(session.tracks).toEqual(result.tracks);
      expect(session.recorder).toBe(result.recorder);
      // Arrays are wrapped by Solid's mutable proxy, so identity compare
      // would fail; structural equality is what we want to pin.
      expect(session.chunks).toEqual(result.chunks);
      expect(session.streams['1']).toBe(result.streams['1']);
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
    it('transitions to stopping and freezes the timer', () => {
      const { session, timer, useAction } = setup();
      useAction(setRecordingContext)(makeResult());
      useAction(beginRecording)();

      useAction(beginStop)();

      expect(session.status).toBe('stopping');
      expect(timer.running).toBe(false);
    });
  });

  describe('finalizeRecording', () => {
    it('clears session fields and appends the recording to the library', () => {
      const { session, library, useAction } = setup();
      useAction(setRecordingContext)(makeResult());

      useAction(finalizeRecording)({
        id: 'rec-1',
        elapsed: 45,
        stoppedAt: 1745250120000,
        url: 'blob:test',
      });

      expect(session.status).toBe('idle');
      expect(session.recorder).toBeNull();
      expect(session.chunks).toBeNull();
      expect(session.streams).toEqual({});
      expect(library.recordings).toHaveLength(1);
      expect(library.recordings[0]).toMatchObject({
        id: 'rec-1',
        duration: 45,
        createdAt: 1745250120000,
        url: 'blob:test',
      });
      // Name is a formatted timestamp; pin that it's a non-empty string.
      expect(library.recordings[0].name).toMatch(/\w+/);
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
    it('appends the track and stores its stream', () => {
      const { session, useAction } = setup();
      const stream = new FakeStream() as unknown as MediaStream;
      const track: Track = {
        id: '3',
        type: 'microphone',
        label: 'Mic',
        live: true,
      };

      useAction(appendTrack)({ track, stream });

      expect(session.tracks).toEqual([track]);
      expect(session.streams['3']).toBe(stream);
    });
  });

  describe('removeTrackFromState', () => {
    it('removes the track and drops its stream', () => {
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

  describe('markSupport', () => {
    it('transitions to unsupported when false', () => {
      const { session, useAction } = setup();

      useAction(markSupport)(false);

      expect(session.status).toBe('unsupported');
    });

    it('stays idle when true', () => {
      const { session, useAction } = setup();

      useAction(markSupport)(true);

      expect(session.status).toBe('idle');
    });
  });
});

describe('startRecordingEffect', () => {
  it('onStart runs before the capability resolves', () => {
    vi.mocked(capabilities.startRecording).mockImplementation(
      () => new Promise(() => undefined),
    );
    const bindings = setup();

    void bindings.useEffect(startRecordingEffect)(() => undefined);

    expect(bindings.session.status).toBe('recording');
    expect(bindings.timer.running).toBe(true);
  });

  it('onSuccess populates context', async () => {
    const result = makeResult([
      { id: '1', type: 'screen', label: 'Screen', live: true },
    ]);
    vi.mocked(capabilities.startRecording).mockResolvedValue(result);
    const bindings = setup();

    await bindings.useEffect(startRecordingEffect)(() => undefined);

    expect(bindings.session.tracks).toEqual(result.tracks);
    expect(bindings.session.recorder).toBe(result.recorder);
  });

  it('onFailure surfaces the error', async () => {
    vi.mocked(capabilities.startRecording).mockRejectedValue(
      new Error('Permission denied'),
    );
    const bindings = setup();

    await bindings.useEffect(startRecordingEffect)(() => undefined);

    expect(bindings.session.status).toBe('error');
    expect(bindings.session.error).toBe('Permission denied');
  });
});

describe('pauseRecordingEffect', () => {
  it('pauses the recorder and flips to paused', () => {
    const bindings = setup();
    const { recorder } = arm(bindings);

    bindings.useEffect(pauseRecordingEffect)();

    expect(recorder.pause).toHaveBeenCalled();
    expect(bindings.session.status).toBe('paused');
    expect(bindings.timer.running).toBe(false);
  });
});

describe('resumeRecordingEffect', () => {
  it('resumes the recorder and flips back to recording', () => {
    const bindings = setup();
    const { recorder } = arm(bindings);
    bindings.useEffect(pauseRecordingEffect)();

    bindings.useEffect(resumeRecordingEffect)();

    expect(recorder.resume).toHaveBeenCalled();
    expect(bindings.session.status).toBe('recording');
    expect(bindings.timer.running).toBe(true);
  });
});

describe('stopRecordingEffect', () => {
  it('drains the recorder, stops streams, and appends to the library', async () => {
    const bindings = setup();
    const trackStop = vi.fn();
    // Arrange a recorder whose addEventListener invokes the stop handler
    // synchronously, driving the promise to resolution.
    const recorder = {
      pause: vi.fn(),
      resume: vi.fn(),
      stop: vi.fn(),
      mimeType: 'video/webm',
      addEventListener: (
        _event: string,
        handler: EventListenerOrEventListenerObject,
      ) => {
        queueMicrotask(() => (handler as EventListener)(new Event('stop')));
      },
    } as unknown as MediaRecorder;
    const stream = {
      getTracks: () => [{ stop: trackStop }],
    } as unknown as MediaStream;

    bindings.useAction(
      defineAction([sessionStore, timerStore], (session, timer) => {
        session.status = 'recording';
        session.recorder = recorder;
        session.chunks = [];
        session.streams = { '1': stream };
        timer.elapsed = 12;
      }),
    )();

    await bindings.useEffect(stopRecordingEffect)();

    // eslint-disable-next-line @typescript-eslint/unbound-method -- vi.fn has no `this` binding.
    expect(recorder.stop).toHaveBeenCalled();
    expect(trackStop).toHaveBeenCalled();
    expect(bindings.session.status).toBe('idle');
    expect(bindings.session.recorder).toBeNull();
    expect(bindings.library.recordings).toHaveLength(1);
    expect(bindings.library.recordings[0].duration).toBe(12);
  });
});

describe('addTrackEffect', () => {
  it('onSuccess appends the captured track', async () => {
    const stream = new FakeStream() as unknown as MediaStream;
    const track: Track = {
      id: '3',
      type: 'microphone',
      label: 'Mic',
      live: true,
    };
    vi.mocked(capabilities.captureTrack).mockResolvedValue({ track, stream });
    const bindings = setup();

    await bindings.useEffect(addTrackEffect)();

    expect(bindings.session.tracks).toEqual([track]);
    expect(bindings.session.streams['3']).toBe(stream);
  });
});

describe('removeTrackEffect', () => {
  it('stops the track stream and drops it from state', () => {
    const bindings = setup();
    const { trackStop } = arm(bindings);

    bindings.useEffect(removeTrackEffect)('1');

    expect(trackStop).toHaveBeenCalled();
    expect(bindings.session.tracks).toHaveLength(0);
    expect(bindings.session.streams['1']).toBeUndefined();
  });
});

describe('checkSupportEffect', () => {
  it('transitions to unsupported when the capability returns false', () => {
    vi.mocked(capabilities.checkSupport).mockReturnValue(false);
    const bindings = setup();

    bindings.useEffect(checkSupportEffect)();

    expect(bindings.session.status).toBe('unsupported');
  });

  it('stays idle when the capability returns true', () => {
    vi.mocked(capabilities.checkSupport).mockReturnValue(true);
    const bindings = setup();

    bindings.useEffect(checkSupportEffect)();

    expect(bindings.session.status).toBe('idle');
  });
});
