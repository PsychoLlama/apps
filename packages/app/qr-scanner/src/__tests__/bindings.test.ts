import { createTestBindings } from '@lib/state';
import {
  activateStream,
  beginRequest,
  failCamera,
  resetScanner,
} from '../bindings';
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
