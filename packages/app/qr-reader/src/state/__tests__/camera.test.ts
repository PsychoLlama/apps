/** Unit tests for the camera session's state transitions. */

import { createTestController } from '@lib/effects/testing';
import {
  $camera,
  $cameraFailed,
  $cameraOpened,
  $codeRecognized,
  $scanRequested,
  $scanStopped,
  $torchToggled,
  wantsCamera,
} from '../camera';
import type { ScanResult } from '../../worker/rpc';

const result: ScanResult = {
  text: 'https://example.com',
  format: 'QR_CODE',
  kind: 'url',
  details: [],
};

/** The session store and every command over it. */
const setup = async (effects: ReturnType<typeof createTestController>) => ({
  camera: await effects.run($camera),
  scanRequested: await effects.run($scanRequested),
  cameraOpened: await effects.run($cameraOpened),
  cameraFailed: await effects.run($cameraFailed),
  torchToggled: await effects.run($torchToggled),
  scanStopped: await effects.run($scanStopped),
  codeRecognized: await effects.run($codeRecognized),
});

describe('$camera', () => {
  it('seeds an idle session', async () => {
    await using effects = createTestController();
    const camera = await effects.run($camera);

    expect(camera).toEqual({
      status: 'idle',
      error: null,
      torch: { supported: false, on: false },
      result: null,
    });
  });
});

describe('wantsCamera', () => {
  it.each([
    ['idle', false],
    ['requesting', true],
    ['streaming', true],
    ['error', false],
  ] as const)('is %s → %s', (status, expected) => {
    expect(wantsCamera({ status })).toBe(expected);
  });
});

describe('$scanRequested', () => {
  it('marks the request under way', async () => {
    await using effects = createTestController();
    const { camera, scanRequested } = await setup(effects);

    scanRequested();

    expect(camera.status).toBe('requesting');
  });

  it('clears a prior error so "try again" starts clean', async () => {
    await using effects = createTestController();
    const { camera, scanRequested, cameraFailed } = await setup(effects);
    cameraFailed('no-camera');

    scanRequested();

    expect(camera).toMatchObject({ status: 'requesting', error: null });
  });

  it('clears a prior result so "scan again" starts clean', async () => {
    await using effects = createTestController();
    const { camera, scanRequested, codeRecognized } = await setup(effects);
    codeRecognized(result);

    scanRequested();

    expect(camera).toMatchObject({ status: 'requesting', result: null });
  });

  it('leaves a live feed alone', async () => {
    await using effects = createTestController();
    const { camera, scanRequested, cameraOpened } = await setup(effects);
    scanRequested();
    cameraOpened(true);

    scanRequested();

    expect(camera.status).toBe('streaming');
  });
});

describe('$cameraOpened', () => {
  it('goes live, recording the torch and defaulting it off', async () => {
    await using effects = createTestController();
    const { camera, cameraOpened } = await setup(effects);

    cameraOpened(true);

    expect(camera).toMatchObject({
      status: 'streaming',
      torch: { supported: true, on: false },
    });
  });

  it('leaves the torch unsupported when the camera has none', async () => {
    await using effects = createTestController();
    const { camera, cameraOpened } = await setup(effects);

    cameraOpened(false);

    expect(camera.torch.supported).toBe(false);
  });
});

describe('$torchToggled', () => {
  it('records the confirmed torch state', async () => {
    await using effects = createTestController();
    const { camera, cameraOpened, torchToggled } = await setup(effects);
    cameraOpened(true);

    torchToggled(true);

    expect(camera.torch.on).toBe(true);
  });
});

describe('$cameraFailed', () => {
  it('records the failure and resets the torch', async () => {
    await using effects = createTestController();
    const { camera, cameraOpened, cameraFailed } = await setup(effects);
    cameraOpened(true);

    cameraFailed('permission-denied');

    expect(camera).toEqual({
      status: 'error',
      error: 'permission-denied',
      torch: { supported: false, on: false },
      result: null,
    });
  });
});

describe('$scanStopped', () => {
  it('returns to a clean idle state', async () => {
    await using effects = createTestController();
    const { camera, cameraOpened, torchToggled, scanStopped } =
      await setup(effects);
    cameraOpened(true);
    torchToggled(true);

    scanStopped();

    expect(camera).toEqual({
      status: 'idle',
      error: null,
      torch: { supported: false, on: false },
      result: null,
    });
  });
});

describe('$codeRecognized', () => {
  it('parks on the result and returns to idle', async () => {
    await using effects = createTestController();
    const { camera, cameraOpened, codeRecognized } = await setup(effects);
    cameraOpened(true);

    codeRecognized(result);

    expect(camera).toMatchObject({
      status: 'idle',
      torch: { supported: false, on: false },
      result,
    });
    expect(wantsCamera(camera)).toBe(false);
  });
});
