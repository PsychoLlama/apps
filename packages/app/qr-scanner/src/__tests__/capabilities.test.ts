import { ref } from '@lib/state';
import { CameraError, classifyCameraError, stopStream } from '../capabilities';
import type { ScannerState } from '../store';

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
    const stream = { getTracks: () => tracks } as unknown as MediaStream;
    const state: ScannerState = {
      status: 'streaming',
      stream: ref(stream),
      error: null,
    };

    stopStream(state);

    expect(tracks[0].stop).toHaveBeenCalledOnce();
    expect(tracks[1].stop).toHaveBeenCalledOnce();
  });

  it('is a no-op when no stream is open', () => {
    const state: ScannerState = { status: 'idle', stream: null, error: null };
    expect(() => stopStream(state)).not.toThrow();
  });
});
