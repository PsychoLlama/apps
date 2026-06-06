import { createTestBindings } from '@lib/state';
import {
  abortRequest,
  activateStream,
  beginRequest,
  failCamera,
  resetScanner,
} from '../bindings';
import { CameraAborted } from '../capabilities';
import { scannerStore } from '../store';

const setup = () => {
  const bindings = createTestBindings();
  return { ...bindings, scanner: bindings.createStore(scannerStore) };
};

const fakeStream = { getTracks: () => [] } as unknown as MediaStream;

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

    // Abort moves the session back to idle; a late CameraAborted failure
    // must not clobber that with an error.
    useAction(beginRequest)();
    useAction(abortRequest)();
    useAction(failCamera)(new CameraAborted());

    expect(scanner.status).toBe('idle');
    expect(scanner.error).toBeNull();
  });
});

describe('resetScanner', () => {
  it('returns to a clean idle state', () => {
    const { scanner, useAction } = setup();

    useAction(activateStream)(fakeStream);
    useAction(resetScanner)();

    expect(scanner.status).toBe('idle');
    expect(scanner.stream).toBeNull();
    expect(scanner.error).toBeNull();
  });
});

describe('abortRequest', () => {
  it('returns to idle and bumps the generation to supersede the pending request', () => {
    const { scanner, useAction } = setup();

    useAction(beginRequest)();
    const pendingGeneration = scanner.generation;
    useAction(abortRequest)();

    expect(scanner.status).toBe('idle');
    expect(scanner.stream).toBeNull();
    expect(scanner.generation).toBe(pendingGeneration + 1);
  });
});
