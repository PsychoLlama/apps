import { createTestController } from '@lib/effects/testing';
import {
  cameraPermissionGranted,
  openCamera,
  setTorch,
  stopStream,
  type LiveCamera,
} from '../../platform/camera';
import {
  $camera,
  $cameraOpened,
  $codeRecognized,
  $scanRequested,
} from '../../state';
import { $autoStartScan, $liveCamera, $toggleTorch } from '../camera';

// `classifyCameraError` stays real: the failure path depends on it.
vi.mock(import('../../platform/camera'), async (importOriginal) => ({
  ...(await importOriginal()),
  cameraPermissionGranted: vi.fn(),
  openCamera: vi.fn(),
  setTorch: vi.fn(),
  stopStream: vi.fn(),
}));

/** A stand-in stream. The effects only hand it onward. */
const stream = {} as MediaStream;

const live: LiveCamera = { stream, torch: true };

const namedError = (name: string): Error => {
  const error = new Error(name);
  error.name = name;
  return error;
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('$liveCamera', () => {
  it('goes live, yielding the stream', async () => {
    vi.mocked(openCamera).mockResolvedValue(live);
    await using effects = createTestController();
    const camera = await effects.run($camera);

    await expect(effects.run($liveCamera)).resolves.toBe(stream);
    expect(camera).toMatchObject({
      status: 'streaming',
      torch: { supported: true, on: false },
    });
  });

  it('stops the stream on release', async () => {
    vi.mocked(openCamera).mockResolvedValue(live);
    const effects = createTestController();
    await effects.run($liveCamera);
    expect(stopStream).not.toHaveBeenCalled();

    await effects[Symbol.asyncDispose]();

    expect(stopStream).toHaveBeenCalledWith(stream);
  });

  it('stops a stream that lands after the release', async () => {
    const { promise, resolve } = Promise.withResolvers<LiveCamera>();
    vi.mocked(openCamera).mockReturnValue(promise);
    await using effects = createTestController();
    const handle = effects.controller.acquire($liveCamera);
    const computed = effects.controller.compute(handle);

    // The page went away while the permission prompt was still open. Its
    // compute rejects, since nothing holds it any more.
    const released = effects.controller.release(handle);
    resolve(live);
    await expect(computed.value).rejects.toThrow('released');
    await released;

    expect(stopStream).toHaveBeenCalledWith(stream);
  });

  it('records a failed request, normalizing the cause for the UI', async () => {
    vi.mocked(openCamera).mockRejectedValue(namedError('NotAllowedError'));
    await using effects = createTestController();
    const camera = await effects.run($camera);

    await expect(effects.run($liveCamera)).resolves.toBeNull();
    expect(camera).toMatchObject({
      status: 'error',
      error: 'permission-denied',
    });
  });
});

describe('$autoStartScan', () => {
  it('requests the camera when permission already stands', async () => {
    vi.mocked(cameraPermissionGranted).mockResolvedValue(true);
    await using effects = createTestController();
    const camera = await effects.run($camera);

    await effects.run($autoStartScan);

    expect(camera.status).toBe('requesting');
  });

  it('leaves the landing pitch up when permission is not granted', async () => {
    vi.mocked(cameraPermissionGranted).mockResolvedValue(false);
    await using effects = createTestController();
    const camera = await effects.run($camera);

    await effects.run($autoStartScan);

    expect(camera.status).toBe('idle');
  });

  it('leaves a session the user already moved on alone', async () => {
    const { promise, resolve } = Promise.withResolvers<boolean>();
    vi.mocked(cameraPermissionGranted).mockReturnValue(promise);
    await using effects = createTestController();
    const camera = await effects.run($camera);
    const codeRecognized = await effects.run($codeRecognized);
    const autoStart = effects.run($autoStartScan);

    // A scan landed while the probe was in flight.
    codeRecognized({
      text: 'hi',
      format: 'QR_CODE',
      kind: 'text',
      details: [],
    });
    resolve(true);
    await autoStart;

    expect(camera.status).toBe('idle');
  });

  it('leaves a session the user already started alone', async () => {
    const { promise, resolve } = Promise.withResolvers<boolean>();
    vi.mocked(cameraPermissionGranted).mockReturnValue(promise);
    await using effects = createTestController();
    const camera = await effects.run($camera);
    const scanRequested = await effects.run($scanRequested);
    const cameraOpened = await effects.run($cameraOpened);
    const autoStart = effects.run($autoStartScan);

    // The user tapped start, and the feed opened, while the probe ran.
    scanRequested();
    cameraOpened(false);
    resolve(true);
    await autoStart;

    expect(camera.status).toBe('streaming');
  });
});

describe('$toggleTorch', () => {
  it('records the torch state the hardware confirmed', async () => {
    vi.mocked(openCamera).mockResolvedValue(live);
    vi.mocked(setTorch).mockResolvedValue(true);
    await using effects = createTestController();
    const camera = await effects.run($camera);
    const toggleTorch = await effects.run($toggleTorch);

    await toggleTorch(true);

    expect(setTorch).toHaveBeenCalledWith(stream, true);
    expect(camera.torch.on).toBe(true);
  });

  it('swallows a refused toggle, leaving the flag as it was', async () => {
    vi.mocked(openCamera).mockResolvedValue(live);
    vi.mocked(setTorch).mockRejectedValue(new Error('nope'));
    await using effects = createTestController();
    const camera = await effects.run($camera);
    const toggleTorch = await effects.run($toggleTorch);

    await expect(toggleTorch(true)).resolves.toBeUndefined();
    expect(camera.torch.on).toBe(false);
  });

  it('does nothing without a live stream', async () => {
    vi.mocked(openCamera).mockRejectedValue(namedError('NotFoundError'));
    await using effects = createTestController();
    const toggleTorch = await effects.run($toggleTorch);

    await toggleTorch(true);

    expect(setTorch).not.toHaveBeenCalled();
  });
});
