import { createTestController } from '@lib/effects/testing';
import type { Navigator } from '@solidjs/router';
import { launchScanTarget, vibrate } from '../../platform/device';
import { $camera, $cameraOpened } from '../../state';
import type { ScanResult } from '../../worker/rpc';
import { $finishScan } from '../scan';

vi.mock('../../platform/device');

const result: ScanResult = {
  text: 'https://example.com',
  format: 'QR_CODE',
  kind: 'url',
  details: [],
};

const navigate = vi.fn() as unknown as Navigator;

beforeEach(() => {
  vi.resetAllMocks();
});

describe('$finishScan', () => {
  it('buzzes, launches the link, and parks on the result', async () => {
    await using effects = createTestController();
    const camera = await effects.run($camera);
    const cameraOpened = await effects.run($cameraOpened);
    const finishScan = await effects.run($finishScan);
    cameraOpened(true);

    finishScan(result, navigate);

    expect(vibrate).toHaveBeenCalledOnce();
    expect(launchScanTarget).toHaveBeenCalledWith(result, navigate);
    expect(camera).toMatchObject({ status: 'idle', result });
  });
});
