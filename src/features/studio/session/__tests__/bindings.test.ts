import { createTestBindings } from '#state';
import { libraryStore } from '../../library/store';
import { timerStore } from '../../timer/store';
import type { RecordingResult } from '../capabilities';
import {
  appendTrack,
  beginPause,
  beginRecording,
  beginResume,
  beginStop,
  finalizeRecording,
  markError,
  markSupport,
  removeTrackFromState,
  setRecordingContext,
} from '../bindings';
import { sessionStore } from '../store';
import type { Track } from '../types';

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
  tracks: { stop: () => void }[];
  constructor(tracks: { stop: () => void }[] = []) {
    this.tracks = tracks;
  }
  getTracks(): { stop: () => void }[] {
    return this.tracks;
  }
}

function setup() {
  const bindings = createTestBindings();
  return {
    ...bindings,
    session: bindings.createStore(sessionStore),
    timer: bindings.createStore(timerStore),
    library: bindings.createStore(libraryStore),
  };
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
