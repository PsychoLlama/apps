import { ref } from '@lib/state';
import MediaDevices from 'media-devices';
import {
  CameraAborted,
  CameraError,
  classifyCameraError,
  isAndroid,
  openCameraSession,
  setTorch,
  stopStream,
  stopStreamForResult,
  supportsTorch,
} from '../capabilities';
import type { ScannerState, ScanResult } from '../store';

vi.mock('media-devices', () => ({
  default: { getUserMedia: vi.fn() },
  supportsMediaDevices: vi.fn(() => true),
}));

const fakeStream = (tracks: Array<{ stop: ReturnType<typeof vi.fn> }>) =>
  ({ getTracks: () => tracks }) as unknown as MediaStream;

/** Build an Error carrying a specific `name`, the signal we classify on. */
const namedError = (name: string): Error => {
  const error = new Error(name);
  error.name = name;
  return error;
};

describe('isAndroid', () => {
  // `userAgentData` is Chromium-only and absent from jsdom; define it
  // directly on the navigator and clear it between cases.
  const stubPlatform = (platform: string | undefined): void => {
    Object.defineProperty(navigator, 'userAgentData', {
      value: platform === undefined ? undefined : { platform },
      configurable: true,
    });
  };

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'userAgentData');
  });

  it('is true when client hints report Android', () => {
    stubPlatform('Android');
    expect(isAndroid()).toBe(true);
  });

  it('is false on any other platform', () => {
    stubPlatform('Windows');
    expect(isAndroid()).toBe(false);
  });

  it('is false when the client-hints API is absent', () => {
    stubPlatform(undefined);
    expect(isAndroid()).toBe(false);
  });
});

describe('classifyCameraError', () => {
  it('maps permission rejections to permission-denied', () => {
    expect(classifyCameraError(namedError('NotAllowedError'))).toBe(
      'permission-denied',
    );
    expect(classifyCameraError(namedError('SecurityError'))).toBe(
      'permission-denied',
    );
  });

  it('maps missing / over-constrained devices to no-camera', () => {
    expect(classifyCameraError(namedError('NotFoundError'))).toBe('no-camera');
    expect(classifyCameraError(namedError('OverconstrainedError'))).toBe(
      'no-camera',
    );
  });

  it('passes through a CameraError kind verbatim', () => {
    expect(classifyCameraError(new CameraError('unsupported'))).toBe(
      'unsupported',
    );
  });

  it('falls back to unknown for anything unrecognized', () => {
    expect(classifyCameraError(namedError('TeapotError'))).toBe('unknown');
    expect(classifyCameraError('not an error at all')).toBe('unknown');
  });
});

describe('stopStream', () => {
  it('stops every track on the active stream', () => {
    const tracks = [{ stop: vi.fn() }, { stop: vi.fn() }];
    const state: ScannerState = {
      status: 'streaming',
      stream: ref(fakeStream(tracks)),
      error: null,
      torch: { supported: false, on: false },
      decoder: null,
      result: null,
      generation: 1,
      decoderGeneration: 0,
    };

    stopStream(state);

    expect(tracks[0].stop).toHaveBeenCalledOnce();
    expect(tracks[1].stop).toHaveBeenCalledOnce();
  });

  it('is a no-op when no stream is open', () => {
    const state: ScannerState = {
      status: 'idle',
      stream: null,
      error: null,
      torch: { supported: false, on: false },
      decoder: null,
      result: null,
      generation: 0,
      decoderGeneration: 0,
    };
    expect(() => stopStream(state)).not.toThrow();
  });
});

describe('stopStreamForResult', () => {
  it('releases the camera and forwards the result for recording', () => {
    const tracks = [{ stop: vi.fn() }];
    const state: ScannerState = {
      status: 'streaming',
      stream: ref(fakeStream(tracks)),
      error: null,
      torch: { supported: false, on: false },
      decoder: null,
      result: null,
      generation: 1,
      decoderGeneration: 0,
    };
    const result: ScanResult = {
      text: 'https://example.com',
      format: 'QR_CODE',
      kind: 'url',
      details: [],
    };

    expect(stopStreamForResult(state, result)).toEqual(result);
    expect(tracks[0].stop).toHaveBeenCalledOnce();
  });
});

describe('openCameraSession', () => {
  const requestingState = (generation: number): ScannerState => ({
    status: 'requesting',
    stream: null,
    error: null,
    torch: { supported: false, on: false },
    decoder: null,
    result: null,
    generation,
    decoderGeneration: 0,
  });

  it('returns the stream when the request is not superseded', async () => {
    const stream = fakeStream([{ stop: vi.fn() }]);
    vi.mocked(MediaDevices.getUserMedia).mockResolvedValueOnce(stream);

    await expect(openCameraSession(requestingState(1))).resolves.toBe(stream);
  });

  it('stops the stream and aborts when superseded mid-prompt', async () => {
    const tracks = [{ stop: vi.fn() }];
    vi.mocked(MediaDevices.getUserMedia).mockResolvedValueOnce(
      fakeStream(tracks),
    );

    // A live view whose generation is bumped while getUserMedia is pending,
    // mimicking the user navigating away before the prompt resolves.
    const state = requestingState(1);
    const pending = openCameraSession(state);
    state.generation = 2;

    await expect(pending).rejects.toBeInstanceOf(CameraAborted);
    expect(tracks[0].stop).toHaveBeenCalledOnce();
  });
});

/** A stream whose sole video track reports the given capabilities. */
const streamWithVideoTrack = (track: object): MediaStream =>
  ({ getVideoTracks: () => [track] }) as unknown as MediaStream;

describe('supportsTorch', () => {
  it('is true when the video track reports a torch capability', () => {
    const stream = streamWithVideoTrack({
      getCapabilities: () => ({ torch: true }),
    });
    expect(supportsTorch(stream)).toBe(true);
  });

  it('is false when capabilities omit a torch', () => {
    const stream = streamWithVideoTrack({ getCapabilities: () => ({}) });
    expect(supportsTorch(stream)).toBe(false);
  });

  it('is false when the engine lacks getCapabilities', () => {
    const stream = streamWithVideoTrack({});
    expect(supportsTorch(stream)).toBe(false);
  });

  it('is false when there is no video track', () => {
    const stream = { getVideoTracks: () => [] } as unknown as MediaStream;
    expect(supportsTorch(stream)).toBe(false);
  });
});

describe('setTorch', () => {
  const streamingState = (track: object): ScannerState => ({
    status: 'streaming',
    stream: ref(streamWithVideoTrack(track)),
    error: null,
    torch: { supported: true, on: false },
    decoder: null,
    result: null,
    generation: 1,
    decoderGeneration: 0,
  });

  it('applies the torch constraint and resolves with the requested state', async () => {
    const applyConstraints = vi.fn().mockResolvedValue(undefined);
    const state = streamingState({ applyConstraints });

    await expect(setTorch(state, true)).resolves.toBe(true);
    expect(applyConstraints).toHaveBeenCalledWith({
      advanced: [{ torch: true }],
    });
  });

  it('is a no-op resolving with the request when no stream is open', async () => {
    const state: ScannerState = {
      status: 'idle',
      stream: null,
      error: null,
      torch: { supported: false, on: false },
      decoder: null,
      result: null,
      generation: 0,
      decoderGeneration: 0,
    };

    await expect(setTorch(state, true)).resolves.toBe(true);
  });
});
