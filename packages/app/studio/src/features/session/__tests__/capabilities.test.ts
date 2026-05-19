import type { DeepReadonly } from '@lib/state';
import { persistRecording } from '../../library/capabilities';
import { formatRecordingName } from '../../format';
import {
  captureTrack,
  checkSupport,
  pauseRecording,
  resumeRecording,
  startRecording,
  stopRecording,
  stopTrackStream,
} from '../capabilities';
import type { SessionState } from '../store';

vi.mock('../../library/capabilities', () => ({
  persistRecording: vi.fn().mockResolvedValue(undefined),
}));

// --- Fakes ---
//
// jsdom doesn't ship `navigator.mediaDevices`, `MediaRecorder`, or
// `MediaStream`, so the capability tests provide minimal class-instance
// stand-ins. Class instances also mirror runtime behavior — Solid's
// store primitives leave them unproxied.

class FakeTrack {
  stop = vi.fn();
  addEventListener = vi.fn();
  kind: 'video' | 'audio';
  label: string;
  constructor(kind: 'video' | 'audio' = 'video', label = '') {
    this.kind = kind;
    this.label = label;
  }
}

class FakeMediaStream {
  private tracks: FakeTrack[];
  constructor(tracks: FakeTrack[] = []) {
    this.tracks = [...tracks];
  }
  getTracks(): FakeTrack[] {
    return this.tracks;
  }
  getVideoTracks(): FakeTrack[] {
    return this.tracks.filter((track) => track.kind === 'video');
  }
  addTrack(track: FakeTrack): void {
    this.tracks.push(track);
  }
  removeTrack(track: FakeTrack): void {
    const index = this.tracks.indexOf(track);
    if (index !== -1) this.tracks.splice(index, 1);
  }
}

class FakeMediaRecorder {
  static isTypeSupported = vi.fn(() => true);
  mimeType: string;
  pause = vi.fn();
  resume = vi.fn();
  start = vi.fn();
  stop = vi.fn(() => {
    // Drive `stopRecording`'s `await` to resolution.
    queueMicrotask(() => this.listeners.get('stop')?.(new Event('stop')));
  });
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  private listeners = new Map<string, (event: Event) => void>();
  addEventListener = vi.fn((event: string, handler: (event: Event) => void) => {
    this.listeners.set(event, handler);
  });
  stream: FakeMediaStream;
  constructor(stream: FakeMediaStream, options: { mimeType?: string } = {}) {
    this.stream = stream;
    this.mimeType = options.mimeType ?? 'video/webm';
  }
}

const mediaDevices = {
  getDisplayMedia: vi.fn(),
  getUserMedia: vi.fn(),
};

const asSession = (
  overrides: Partial<SessionState>,
): DeepReadonly<SessionState> => ({
  status: 'recording',
  tracks: [],
  error: null,
  streams: {},
  recorder: null,
  chunks: null,
  lastFinalizedId: null,
  ...overrides,
});

beforeEach(() => {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: mediaDevices,
    configurable: true,
    writable: true,
  });
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
  vi.stubGlobal('MediaStream', FakeMediaStream);
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn(),
  });
  mediaDevices.getDisplayMedia.mockReset();
  mediaDevices.getUserMedia.mockReset();
  FakeMediaRecorder.isTypeSupported.mockReset();
  FakeMediaRecorder.isTypeSupported.mockReturnValue(true);
  vi.mocked(persistRecording).mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('checkSupport', () => {
  it('returns true when mediaDevices.getDisplayMedia exists', () => {
    expect(checkSupport()).toBe(true);
  });

  it('returns false when getDisplayMedia is missing', () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {},
      configurable: true,
    });
    expect(checkSupport()).toBe(false);
  });
});

describe('startRecording', () => {
  it('builds a track + stream + recorder per media kind', async () => {
    const videoTrack = new FakeTrack('video', 'Screen 1');
    const audioTrack = new FakeTrack('audio', 'System Audio');
    mediaDevices.getDisplayMedia.mockResolvedValue(
      new FakeMediaStream([videoTrack, audioTrack]),
    );

    const result = await startRecording(() => undefined);

    expect(mediaDevices.getDisplayMedia).toHaveBeenCalledWith({
      video: true,
      audio: true,
    });
    expect(result.tracks).toHaveLength(2);
    expect(result.tracks[0]).toMatchObject({
      type: 'screen',
      label: 'Screen 1',
    });
    expect(result.tracks[1]).toMatchObject({
      type: 'system-audio',
      label: 'System Audio',
    });
    expect(result.recorder).toBeInstanceOf(FakeMediaRecorder);
    expect(result.chunks).toEqual([]);
  });

  it('falls back to a default label when the media track has none', async () => {
    mediaDevices.getDisplayMedia.mockResolvedValue(
      new FakeMediaStream([new FakeTrack('video', '')]),
    );

    const result = await startRecording(() => undefined);

    expect(result.tracks[0].label).toBe('Screen');
  });

  it('prefers vp9 MIME when supported', async () => {
    mediaDevices.getDisplayMedia.mockResolvedValue(
      new FakeMediaStream([new FakeTrack('video')]),
    );

    const result = await startRecording(() => undefined);

    expect(FakeMediaRecorder.isTypeSupported).toHaveBeenCalledWith(
      'video/webm;codecs=vp9',
    );
    expect(result.recorder.mimeType).toBe('video/webm;codecs=vp9');
  });

  it('falls back to video/webm when vp9 is not supported', async () => {
    FakeMediaRecorder.isTypeSupported.mockReturnValue(false);
    mediaDevices.getDisplayMedia.mockResolvedValue(
      new FakeMediaStream([new FakeTrack('video')]),
    );

    const result = await startRecording(() => undefined);

    expect(result.recorder.mimeType).toBe('video/webm');
  });

  it('arms the onStreamEnded handler on the primary video track', async () => {
    const videoTrack = new FakeTrack('video');
    mediaDevices.getDisplayMedia.mockResolvedValue(
      new FakeMediaStream([videoTrack]),
    );
    const handler = vi.fn();

    await startRecording(handler);

    expect(videoTrack.addEventListener).toHaveBeenCalledWith('ended', handler, {
      once: true,
    });
  });
});

describe('stopRecording', () => {
  it('throws when no recorder is active', async () => {
    await expect(
      stopRecording(asSession({}), { startedAt: null, elapsed: 0 }),
    ).rejects.toThrow(/no active recorder/i);
  });

  it('drains chunks into a single mime-typed blob', async () => {
    const recorder = new FakeMediaRecorder(new FakeMediaStream(), {
      mimeType: 'video/webm;codecs=vp9',
    });
    const session = asSession({
      recorder: recorder as unknown as MediaRecorder,
      chunks: [new Blob(['hello']), new Blob([' world'])],
      streams: {},
    });

    await stopRecording(session, { startedAt: null, elapsed: 0 });

    const blob = vi.mocked(persistRecording).mock.calls[0][0].blob;
    expect(blob.type).toBe('video/webm;codecs=vp9');
    expect(await blob.text()).toBe('hello world');
  });

  it('persists the same blob it hands to URL.createObjectURL', async () => {
    const createObjectURL = vi.fn(() => 'blob:mock');
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() });
    const recorder = new FakeMediaRecorder(new FakeMediaStream());
    const session = asSession({
      recorder: recorder as unknown as MediaRecorder,
      chunks: [new Blob(['x'])],
      streams: {},
    });

    await stopRecording(session, { startedAt: null, elapsed: 0 });

    const persistedBlob = vi.mocked(persistRecording).mock.calls[0][0].blob;
    expect(createObjectURL).toHaveBeenCalledWith(persistedBlob);
  });

  it('derives createdAt from the wall clock and name from createdAt', async () => {
    const stoppedAt = 1745250000000;
    vi.spyOn(Date, 'now').mockReturnValue(stoppedAt);
    const recorder = new FakeMediaRecorder(new FakeMediaStream());
    const session = asSession({
      recorder: recorder as unknown as MediaRecorder,
      chunks: [new Blob(['x'])],
      streams: {},
    });

    const result = await stopRecording(session, {
      startedAt: null,
      elapsed: 42,
    });

    expect(result.createdAt).toBe(stoppedAt);
    expect(result.name).toBe(formatRecordingName(stoppedAt));
    expect(result.duration).toBe(42);
  });

  it('reports the blob size so the library can render storage usage', async () => {
    const recorder = new FakeMediaRecorder(new FakeMediaStream());
    const session = asSession({
      recorder: recorder as unknown as MediaRecorder,
      chunks: [new Blob(['1234567890'])],
      streams: {},
    });

    const result = await stopRecording(session, {
      startedAt: null,
      elapsed: 0,
    });

    expect(result.size).toBe(10);
  });

  it('mints a UUID for the recording id', async () => {
    const recorder = new FakeMediaRecorder(new FakeMediaStream());
    const session = asSession({
      recorder: recorder as unknown as MediaRecorder,
      chunks: [new Blob(['x'])],
      streams: {},
    });

    const result = await stopRecording(session, {
      startedAt: null,
      elapsed: 0,
    });

    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('stops the recorder and releases every captured track', async () => {
    const recorder = new FakeMediaRecorder(new FakeMediaStream());
    const screenTrack = new FakeTrack();
    const audioTrack = new FakeTrack('audio');
    const session = asSession({
      recorder: recorder as unknown as MediaRecorder,
      chunks: [new Blob(['x'])],
      streams: {
        '1': new FakeMediaStream([screenTrack]) as unknown as MediaStream,
        '2': new FakeMediaStream([audioTrack]) as unknown as MediaStream,
      },
    });

    await stopRecording(session, { startedAt: null, elapsed: 0 });

    expect(recorder.stop).toHaveBeenCalled();
    expect(screenTrack.stop).toHaveBeenCalled();
    expect(audioTrack.stop).toHaveBeenCalled();
  });

  it('still returns a playable recording when persistence fails', async () => {
    const createObjectURL = vi.fn(() => 'blob:mock');
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() });
    vi.mocked(persistRecording).mockRejectedValueOnce(new Error('disk-fail'));
    const recorder = new FakeMediaRecorder(new FakeMediaStream());
    const session = asSession({
      recorder: recorder as unknown as MediaRecorder,
      chunks: [new Blob(['x'])],
      streams: {},
    });

    const result = await stopRecording(session, {
      startedAt: null,
      elapsed: 0,
    });

    expect(result.url).toBe('blob:mock');
  });
});

describe('pauseRecording', () => {
  it('pauses the active recorder', () => {
    const recorder = new FakeMediaRecorder(new FakeMediaStream());
    pauseRecording(
      asSession({ recorder: recorder as unknown as MediaRecorder }),
    );
    expect(recorder.pause).toHaveBeenCalled();
  });

  it('is a no-op when no recorder is active', () => {
    expect(() => pauseRecording(asSession({}))).not.toThrow();
  });
});

describe('resumeRecording', () => {
  it('resumes the active recorder', () => {
    const recorder = new FakeMediaRecorder(new FakeMediaStream());
    resumeRecording(
      asSession({ recorder: recorder as unknown as MediaRecorder }),
    );
    expect(recorder.resume).toHaveBeenCalled();
  });

  it('is a no-op when no recorder is active', () => {
    expect(() => resumeRecording(asSession({}))).not.toThrow();
  });
});

describe('captureTrack', () => {
  it('asks for microphone audio and returns a mic track', async () => {
    const micTrack = new FakeTrack('audio', 'Internal Mic');
    const stream = new FakeMediaStream([micTrack]);
    mediaDevices.getUserMedia.mockResolvedValue(stream);

    const result = await captureTrack(asSession({}));

    expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(result.track).toMatchObject({
      type: 'microphone',
      label: 'Internal Mic',
    });
    expect(result.stream).toBe(stream as unknown as MediaStream);
  });

  it('falls back to a default label', async () => {
    mediaDevices.getUserMedia.mockResolvedValue(
      new FakeMediaStream([new FakeTrack('audio', '')]),
    );

    const result = await captureTrack(asSession({}));

    expect(result.track.label).toBe('Microphone');
  });

  it('attaches the new media track to the live recorder stream', async () => {
    const recorderStream = new FakeMediaStream();
    const recorder = new FakeMediaRecorder(recorderStream);
    const micTrack = new FakeTrack('audio', 'Mic');
    mediaDevices.getUserMedia.mockResolvedValue(
      new FakeMediaStream([micTrack]),
    );

    await captureTrack(
      asSession({ recorder: recorder as unknown as MediaRecorder }),
    );

    expect(recorderStream.getTracks()).toContain(micTrack);
  });

  it('is safe when no recorder is active yet', async () => {
    mediaDevices.getUserMedia.mockResolvedValue(
      new FakeMediaStream([new FakeTrack('audio')]),
    );

    await expect(captureTrack(asSession({}))).resolves.toBeDefined();
  });
});

describe('stopTrackStream', () => {
  it('stops every track on the identified stream and returns the id', () => {
    const track = new FakeTrack();
    const session = asSession({
      streams: {
        'track-1': new FakeMediaStream([track]) as unknown as MediaStream,
      },
    });

    const id = stopTrackStream(session, 'track-1');

    expect(track.stop).toHaveBeenCalled();
    expect(id).toBe('track-1');
  });

  it('detaches the track from the recorder stream before stopping', () => {
    const track = new FakeTrack();
    const recorderStream = new FakeMediaStream([track]);
    const recorder = new FakeMediaRecorder(recorderStream);
    const session = asSession({
      recorder: recorder as unknown as MediaRecorder,
      streams: {
        'track-1': new FakeMediaStream([track]) as unknown as MediaStream,
      },
    });

    stopTrackStream(session, 'track-1');

    expect(recorderStream.getTracks()).not.toContain(track);
    expect(track.stop).toHaveBeenCalled();
  });

  it('is a no-op on an unknown id', () => {
    const id = stopTrackStream(asSession({ streams: {} }), 'missing');
    expect(id).toBe('missing');
  });
});
