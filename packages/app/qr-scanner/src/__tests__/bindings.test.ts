import { createTestBindings } from '@lib/state';
import {
  activateStream,
  attachDecoder,
  beginRequest,
  endSession,
  failCamera,
  recordScan,
  resetScanner,
  setTorchOn,
} from '../bindings';
import { CameraAborted } from '../capabilities';
import { scannerStore } from '../store';

const setup = () => {
  const bindings = createTestBindings();
  return { ...bindings, scanner: bindings.createStore(scannerStore) };
};

/** A stream with no controllable torch — the common, cross-device case. */
const fakeStream = {
  getTracks: () => [],
  getVideoTracks: () => [],
} as unknown as MediaStream;

/** A stream whose video track reports a torch capability. */
const torchStream = {
  getTracks: () => [],
  getVideoTracks: () => [{ getCapabilities: () => ({ torch: true }) }],
} as unknown as MediaStream;

const namedError = (name: string): Error => {
  const error = new Error(name);
  error.name = name;
  return error;
};

describe('beginRequest', () => {
  it('enters the requesting state and clears any prior error', () => {
    const { scanner, useAction } = setup();

    useAction(failCamera)(namedError('NotFoundError'));
    useAction(beginRequest)();

    expect(scanner.status).toBe('requesting');
    expect(scanner.error).toBeNull();
  });

  it('bumps the generation so an in-flight request can detect supersession', () => {
    const { scanner, useAction } = setup();

    const before = scanner.generation;
    useAction(beginRequest)();

    expect(scanner.generation).toBe(before + 1);
  });
});

describe('activateStream', () => {
  it('goes live and attaches the stream behind a ref', () => {
    const { scanner, useAction } = setup();

    useAction(activateStream)(fakeStream);

    expect(scanner.status).toBe('streaming');
    expect(scanner.stream?.current).toBe(fakeStream);
    expect(scanner.error).toBeNull();
  });

  it('probes the stream for a torch, defaulting it off', () => {
    const { scanner, useAction } = setup();

    useAction(activateStream)(torchStream);

    expect(scanner.torch).toEqual({ supported: true, on: false });
  });

  it('leaves the torch unsupported when the stream has none', () => {
    const { scanner, useAction } = setup();

    useAction(activateStream)(fakeStream);

    expect(scanner.torch).toEqual({ supported: false, on: false });
  });
});

describe('setTorchOn', () => {
  it('records the confirmed torch state', () => {
    const { scanner, useAction } = setup();

    useAction(activateStream)(torchStream);
    useAction(setTorchOn)(true);

    expect(scanner.torch.on).toBe(true);
  });
});

describe('failCamera', () => {
  it('records the error, classifying the cause, and drops the stream', () => {
    const { scanner, useAction } = setup();

    useAction(activateStream)(fakeStream);
    useAction(failCamera)(namedError('NotAllowedError'));

    expect(scanner.status).toBe('error');
    expect(scanner.error).toBe('permission-denied');
    expect(scanner.stream).toBeNull();
  });

  it('leaves an aborted request alone — the abort already tore state down', () => {
    const { scanner, useAction } = setup();

    // Shutdown moves the session back to idle; a late CameraAborted
    // failure must not clobber that with an error.
    useAction(beginRequest)();
    useAction(endSession)();
    useAction(failCamera)(new CameraAborted());

    expect(scanner.status).toBe('idle');
    expect(scanner.error).toBeNull();
  });
});

describe('resetScanner', () => {
  it('returns to a clean idle state', () => {
    const { scanner, useAction } = setup();

    useAction(activateStream)(torchStream);
    useAction(setTorchOn)(true);
    useAction(resetScanner)();

    expect(scanner.status).toBe('idle');
    expect(scanner.stream).toBeNull();
    expect(scanner.error).toBeNull();
    expect(scanner.torch).toEqual({ supported: false, on: false });
  });
});

describe('recordScan', () => {
  const result = { text: 'https://example.com', format: 'QR_CODE' };

  it('records the decoded result into state', () => {
    const { scanner, useAction } = setup();

    useAction(recordScan)(result);

    expect(scanner.result).toEqual(result);
  });

  it('is cleared by a scanner reset', () => {
    const { scanner, useAction } = setup();

    useAction(recordScan)(result);
    useAction(resetScanner)();

    expect(scanner.result).toBeNull();
  });
});

describe('endSession', () => {
  /** A worker stand-in — `endSession` only drops the reference, never calls it. */
  const fakeWorker = { terminate: () => {} } as unknown as Worker;

  it('returns to idle and bumps the generation to supersede a pending request', () => {
    const { scanner, useAction } = setup();

    useAction(beginRequest)();
    const pendingGeneration = scanner.generation;
    useAction(endSession)();

    expect(scanner.status).toBe('idle');
    expect(scanner.stream).toBeNull();
    expect(scanner.generation).toBe(pendingGeneration + 1);
  });

  it('clears the decoder reference and the last result', () => {
    const { scanner, useAction } = setup();

    useAction(attachDecoder)(fakeWorker);
    useAction(recordScan)({ text: 'https://example.com', format: 'QR_CODE' });
    useAction(endSession)();

    expect(scanner.decoder).toBeNull();
    expect(scanner.result).toBeNull();
  });
});
