import MediaDevices, { supportsMediaDevices } from 'media-devices';
import {
  CameraError,
  cameraPermissionGranted,
  classifyCameraError,
  openCamera,
  setTorch,
  stopStream,
  supportsTorch,
} from '../camera';

vi.mock('media-devices', () => ({
  default: { getUserMedia: vi.fn() },
  supportsMediaDevices: vi.fn(() => true),
}));

const fakeStream = (tracks: Array<{ stop: ReturnType<typeof vi.fn> }>) =>
  ({
    getTracks: () => tracks,
    getVideoTracks: () => [],
  }) as unknown as MediaStream;

/** A stream whose sole video track reports the given capabilities. */
const streamWithVideoTrack = (track: object): MediaStream =>
  ({
    getTracks: () => [],
    getVideoTracks: () => [track],
  }) as unknown as MediaStream;

/** Build an Error carrying a specific `name`, the signal we classify on. */
const namedError = (name: string): Error => {
  const error = new Error(name);
  error.name = name;
  return error;
};

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

describe('cameraPermissionGranted', () => {
  const originalPermissions = navigator.permissions;

  const stubPermissions = (permissions: unknown) => {
    Object.defineProperty(navigator, 'permissions', {
      value: permissions,
      configurable: true,
    });
  };

  afterEach(() => stubPermissions(originalPermissions));

  it('is true when the camera permission is granted', async () => {
    const query = vi.fn().mockResolvedValue({ state: 'granted' });
    stubPermissions({ query });

    await expect(cameraPermissionGranted()).resolves.toBe(true);
    expect(query).toHaveBeenCalledWith({ name: 'camera' });
  });

  it('is false when the grant is still pending or denied', async () => {
    stubPermissions({ query: vi.fn().mockResolvedValue({ state: 'prompt' }) });
    await expect(cameraPermissionGranted()).resolves.toBe(false);

    stubPermissions({ query: vi.fn().mockResolvedValue({ state: 'denied' }) });
    await expect(cameraPermissionGranted()).resolves.toBe(false);
  });

  it('is false when the Permissions API is absent', async () => {
    stubPermissions(undefined);
    await expect(cameraPermissionGranted()).resolves.toBe(false);
  });

  it('is false when querying the camera permission throws (e.g. Firefox)', async () => {
    stubPermissions({
      query: vi.fn().mockRejectedValue(new TypeError('unsupported name')),
    });
    await expect(cameraPermissionGranted()).resolves.toBe(false);
  });
});

describe('stopStream', () => {
  it('stops every track on the stream', () => {
    const tracks = [{ stop: vi.fn() }, { stop: vi.fn() }];

    stopStream(fakeStream(tracks));

    expect(tracks[0].stop).toHaveBeenCalledOnce();
    expect(tracks[1].stop).toHaveBeenCalledOnce();
  });
});

describe('openCamera', () => {
  it('resolves with the live stream and its torch support', async () => {
    const stream = streamWithVideoTrack({
      getCapabilities: () => ({ torch: true }),
    });
    vi.mocked(MediaDevices.getUserMedia).mockResolvedValueOnce(stream);

    await expect(openCamera()).resolves.toEqual({ stream, torch: true });
  });

  it('rejects when the browser has no camera API', async () => {
    vi.mocked(supportsMediaDevices).mockReturnValueOnce(false);

    await expect(openCamera()).rejects.toThrow(CameraError);
  });
});

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
  it('applies the torch constraint and resolves with the requested state', async () => {
    const applyConstraints = vi.fn().mockResolvedValue(undefined);
    const stream = streamWithVideoTrack({ applyConstraints });

    await expect(setTorch(stream, true)).resolves.toBe(true);
    expect(applyConstraints).toHaveBeenCalledWith({
      advanced: [{ torch: true }],
    });
  });

  it('is a no-op resolving with the request when there is no video track', async () => {
    const stream = { getVideoTracks: () => [] } as unknown as MediaStream;
    await expect(setTorch(stream, true)).resolves.toBe(true);
  });

  it('rejects when the hardware refuses the constraint', async () => {
    const stream = streamWithVideoTrack({
      applyConstraints: vi.fn().mockRejectedValue(new Error('nope')),
    });

    await expect(setTorch(stream, true)).rejects.toThrow('nope');
  });
});
