import { ref } from '@lib/state';
import MediaDevices from 'media-devices';
import {
  CameraAborted,
  CameraError,
  classifyCameraError,
  openCameraSession,
  stopStream,
} from '../capabilities';
import type { ScannerState } from '../store';

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
      generation: 1,
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
      generation: 0,
    };
    expect(() => stopStream(state)).not.toThrow();
  });
});

describe('openCameraSession', () => {
  const requestingState = (generation: number): ScannerState => ({
    status: 'requesting',
    stream: null,
    error: null,
    generation,
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
