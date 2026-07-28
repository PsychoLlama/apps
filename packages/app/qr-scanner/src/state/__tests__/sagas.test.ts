/**
 * Unit tests for the scanner's sagas. These run under `simulate`, so there's
 * no runtime and no state — every capability is stubbed and the assertions
 * are about what the saga published and which side effects it reached for.
 */

import { simulate } from '@lib/state-next';
import type { Navigator } from '@solidjs/router';
import {
  cameraFailedTopic,
  cameraOpenedTopic,
  cameraStore,
  codeRecognizedTopic,
  scanRequestedTopic,
  scanStoppedTopic,
  streamCell,
  torchToggledTopic,
  type CameraState,
  type LiveCamera,
} from '../camera';
import {
  cameraPermissionGranted,
  launchScanTarget,
  openCamera,
  releaseCamera,
  setTorch,
  vibrate,
} from '../capabilities';
import { decoderCell, decoderReadyTopic } from '../decoder';
import {
  autoStartScanSaga,
  finishScanSaga,
  preloadDecoderSaga,
  startScanSaga,
  stopScanSaga,
  toggleTorchSaga,
} from '../sagas';
import { createDecoder } from '../../decoder';
import type { DecoderConnection } from '../../decoder';
import type { ScanResult } from '../../worker/rpc';

/** A stand-in stream. The sagas only hand it onward to a capability. */
const fakeStream = {} as MediaStream;

const live: LiveCamera = { stream: fakeStream, torch: true };

const result: ScanResult = {
  text: 'https://example.com',
  format: 'QR_CODE',
  kind: 'url',
  details: [],
};

/** A session in a given lifecycle state; fields default to a fresh page. */
const session = (overrides: Partial<CameraState> = {}): CameraState => ({
  status: 'idle',
  error: null,
  torch: { supported: false, on: false },
  result: null,
  ...overrides,
});

const namedError = (name: string): Error => {
  const error = new Error(name);
  error.name = name;
  return error;
};

describe('startScanSaga', () => {
  it('walks the session from request to live feed', async () => {
    const trace = await simulate(startScanSaga(), {
      reads: [[cameraStore, session()]],
      calls: [[openCamera, () => live]],
    });

    expect(trace.commits).toEqual([
      [scanRequestedTopic()],
      [cameraOpenedTopic(live)],
    ]);
  });

  it('records a failed request, normalizing the cause for the UI', async () => {
    const trace = await simulate(startScanSaga(), {
      reads: [[cameraStore, session()]],
      calls: [
        [
          openCamera,
          () => {
            throw namedError('NotAllowedError');
          },
        ],
      ],
    });

    expect(trace.commits).toEqual([
      [scanRequestedTopic()],
      [cameraFailedTopic('permission-denied')],
    ]);
  });

  it('retries from an error state', async () => {
    const trace = await simulate(startScanSaga(), {
      reads: [[cameraStore, session({ status: 'error', error: 'no-camera' })]],
      calls: [[openCamera, () => live]],
    });

    expect(trace.commits).toEqual([
      [scanRequestedTopic()],
      [cameraOpenedTopic(live)],
    ]);
  });

  it.each(['requesting', 'streaming'] as const)(
    'refuses to open a second camera while %s',
    async (status) => {
      const open = vi.fn(() => live);

      const trace = await simulate(startScanSaga(), {
        reads: [[cameraStore, session({ status })]],
        calls: [[openCamera, open]],
      });

      // The cell holds one stream; a second open would drop the first
      // unstopped, leaving the camera live with nothing holding it.
      expect(open).not.toHaveBeenCalled();
      expect(trace.commits).toEqual([]);
    },
  );
});

describe('autoStartScanSaga', () => {
  it('opens the feed when permission already stands', async () => {
    const trace = await simulate(autoStartScanSaga(), {
      reads: [[cameraStore, session()]],
      calls: [
        [cameraPermissionGranted, () => true],
        [openCamera, () => live],
      ],
    });

    expect(trace.commits).toEqual([
      [scanRequestedTopic()],
      [cameraOpenedTopic(live)],
    ]);
  });

  it('leaves the landing pitch up when permission is not granted', async () => {
    const open = vi.fn(() => live);

    const trace = await simulate(autoStartScanSaga(), {
      calls: [
        [cameraPermissionGranted, () => false],
        [openCamera, open],
      ],
    });

    expect(open).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });

  it('stands down when the user moved the session on mid-probe', async () => {
    const open = vi.fn(() => live);

    const trace = await simulate(autoStartScanSaga(), {
      // The probe resolves async; by then the user had already scanned.
      reads: [[cameraStore, session({ result })]],
      calls: [
        [cameraPermissionGranted, () => true],
        [openCamera, open],
      ],
    });

    expect(open).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });
});

describe('stopScanSaga', () => {
  it('releases the camera before dropping the stream from state', async () => {
    const release = vi.fn();

    const trace = await simulate(stopScanSaga(), {
      reads: [[streamCell, fakeStream]],
      calls: [[releaseCamera, release]],
    });

    // Order matters: the commit drops the reference the release needs.
    expect(release).toHaveBeenCalledWith(expect.any(AbortSignal), fakeStream);
    expect(trace.commits).toEqual([[scanStoppedTopic()]]);
  });
});

describe('toggleTorchSaga', () => {
  it('advances the flag only once the hardware confirms', async () => {
    const trace = await simulate(toggleTorchSaga(true), {
      reads: [[streamCell, fakeStream]],
      calls: [[setTorch, (_signal: AbortSignal, _stream, on: boolean) => on]],
    });

    expect(trace.commits).toEqual([[torchToggledTopic(true)]]);
  });

  it('leaves the flag alone when the hardware rejects the change', async () => {
    const trace = await simulate(toggleTorchSaga(true), {
      reads: [[streamCell, fakeStream]],
      calls: [
        [
          setTorch,
          () => {
            throw new Error('OverconstrainedError');
          },
        ],
      ],
    });

    // A torch that won't switch is a degraded nicety, not an error worth
    // surfacing — and the button keeps reflecting reality.
    expect(trace.commits).toEqual([]);
  });
});

describe('preloadDecoderSaga', () => {
  const connection = {} as DecoderConnection;

  it('holds the worker once its wasm is live', async () => {
    const trace = await simulate(preloadDecoderSaga(), {
      reads: [[decoderCell, null]],
      calls: [[createDecoder, () => connection]],
    });

    expect(trace.commits).toEqual([[decoderReadyTopic(connection)]]);
  });

  it('refuses to spawn a second worker over a live one', async () => {
    const spawn = vi.fn(() => connection);

    const trace = await simulate(preloadDecoderSaga(), {
      reads: [[decoderCell, connection]],
      calls: [[createDecoder, spawn]],
    });

    // The cell holds one worker; a second spawn would strand the first.
    expect(spawn).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });
});

describe('finishScanSaga', () => {
  const navigate = vi.fn() as unknown as Navigator;

  const effects = () =>
    [
      [releaseCamera, vi.fn()],
      [vibrate, vi.fn()],
      [launchScanTarget, vi.fn()],
    ] as const;

  it('parks the session on the result', async () => {
    const trace = await simulate(finishScanSaga({ result, navigate }), {
      reads: [[streamCell, fakeStream]],
      calls: effects(),
    });

    expect(trace.commits).toEqual([[codeRecognizedTopic(result)]]);
  });

  it('releases the camera on the hit rather than holding it open', async () => {
    const release = vi.fn();

    await simulate(finishScanSaga({ result, navigate }), {
      reads: [[streamCell, fakeStream]],
      calls: [...effects(), [releaseCamera, release]],
    });

    // Holding the feed open behind the result surface would leave the
    // hardware running with no visible stop control.
    expect(release).toHaveBeenCalledWith(expect.any(AbortSignal), fakeStream);
  });

  it('buzzes and offers the code up for launching', async () => {
    const buzz = vi.fn();
    const launch = vi.fn();

    await simulate(finishScanSaga({ result, navigate }), {
      reads: [[streamCell, fakeStream]],
      calls: [...effects(), [vibrate, buzz], [launchScanTarget, launch]],
    });

    expect(buzz).toHaveBeenCalledWith(expect.any(AbortSignal), 40);
    expect(launch).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      result,
      navigate,
    );
  });
});
