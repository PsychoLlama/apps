/**
 * Unit tests for the camera session's folds — the state transitions a scan
 * publishes, plus the lifetime guarantee the page hangs off: the stream is
 * stopped when the last anchor is released. Nothing here dereferences a real
 * stream, so the tests stand in fakes.
 */

import { createTestRuntime } from '@lib/state';
import {
  cameraFailedTopic,
  cameraOpenedTopic,
  cameraStore,
  codeRecognizedTopic,
  scanRequestedTopic,
  scanStoppedTopic,
  streamCell,
  torchToggledTopic,
} from '../camera';
import { scannerScope } from '../scope';
import type { ScanResult } from '../../worker/rpc';

/** A stand-in stream. Only `getTracks` is called, and only on teardown. */
const fakeStream = (stop: () => void = () => undefined): MediaStream =>
  ({ getTracks: () => [{ stop }] }) as unknown as MediaStream;

const result: ScanResult = {
  text: 'https://example.com',
  format: 'QR_CODE',
  kind: 'url',
  details: [],
};

const setup = () => {
  const runtime = createTestRuntime();
  const release = runtime.anchor(scannerScope);
  return { ...runtime, release };
};

describe('cameraStore', () => {
  it('seeds an idle session with no stream', () => {
    const { peek } = setup();

    expect(peek(cameraStore)).toEqual({
      status: 'idle',
      error: null,
      torch: { supported: false, on: false },
      result: null,
    });
    expect(peek(streamCell)).toBeNull();
  });
});

describe('scanRequestedTopic', () => {
  it('marks the request under way', () => {
    const { commit, peek } = setup();

    commit(scanRequestedTopic());

    expect(peek(cameraStore).status).toBe('requesting');
  });

  it('clears a prior error so "try again" starts clean', () => {
    const { commit, peek } = setup();
    commit(cameraFailedTopic('no-camera'));

    commit(scanRequestedTopic());

    expect(peek(cameraStore).error).toBeNull();
  });

  it('clears a prior result so "scan again" starts clean', () => {
    const { commit, peek } = setup();
    commit(codeRecognizedTopic(result));

    commit(scanRequestedTopic());

    expect(peek(cameraStore).result).toBeNull();
  });
});

describe('cameraOpenedTopic', () => {
  it('goes live, holding the stream itself', () => {
    const { commit, peek } = setup();
    const stream = fakeStream();

    commit(cameraOpenedTopic({ stream, torch: false }));

    expect(peek(cameraStore).status).toBe('streaming');
    // Identity, not deep equality: a store would hand back a proxy, and the
    // `<video>` element needs the real `MediaStream`.
    expect(peek(streamCell)).toBe(stream);
  });

  it('records the torch the camera turned out to have, defaulting it off', () => {
    const { commit, peek } = setup();

    commit(cameraOpenedTopic({ stream: fakeStream(), torch: true }));

    expect(peek(cameraStore).torch).toEqual({ supported: true, on: false });
  });

  it('leaves the torch unsupported when the camera has none', () => {
    const { commit, peek } = setup();

    commit(cameraOpenedTopic({ stream: fakeStream(), torch: false }));

    expect(peek(cameraStore).torch).toEqual({ supported: false, on: false });
  });
});

describe('torchToggledTopic', () => {
  it('records the confirmed torch state', () => {
    const { commit, peek } = setup();
    commit(cameraOpenedTopic({ stream: fakeStream(), torch: true }));

    commit(torchToggledTopic(true));

    expect(peek(cameraStore).torch).toEqual({ supported: true, on: true });
  });
});

describe('cameraFailedTopic', () => {
  it('records the failure and drops the stream', () => {
    const { commit, peek } = setup();
    commit(cameraOpenedTopic({ stream: fakeStream(), torch: true }));

    commit(cameraFailedTopic('permission-denied'));

    expect(peek(cameraStore).status).toBe('error');
    expect(peek(cameraStore).error).toBe('permission-denied');
    expect(peek(cameraStore).torch).toEqual({ supported: false, on: false });
    expect(peek(streamCell)).toBeNull();
  });
});

describe('scanStoppedTopic', () => {
  it('returns to a clean idle state', () => {
    const { commit, peek } = setup();
    commit(cameraOpenedTopic({ stream: fakeStream(), torch: true }));
    commit(torchToggledTopic(true));

    commit(scanStoppedTopic());

    expect(peek(cameraStore)).toEqual({
      status: 'idle',
      error: null,
      torch: { supported: false, on: false },
      result: null,
    });
    expect(peek(streamCell)).toBeNull();
  });
});

describe('codeRecognizedTopic', () => {
  it('parks on the result: drops the stream and returns to idle', () => {
    const { commit, peek } = setup();
    commit(cameraOpenedTopic({ stream: fakeStream(), torch: true }));

    commit(codeRecognizedTopic(result));

    expect(peek(cameraStore).result).toEqual(result);
    expect(peek(cameraStore).status).toBe('idle');
    expect(peek(cameraStore).torch).toEqual({ supported: false, on: false });
    expect(peek(streamCell)).toBeNull();
  });
});

describe('scannerScope', () => {
  it('stops the live stream when the last anchor is released', () => {
    const stop = vi.fn();
    const { commit, release } = setup();
    commit(cameraOpenedTopic({ stream: fakeStream(stop), torch: false }));

    release();

    expect(stop).toHaveBeenCalledOnce();
  });

  it('has nothing to stop when no stream was ever open', () => {
    const { peek, release } = setup();
    // Touch the cell so it materializes and its drop hook actually runs.
    expect(peek(streamCell)).toBeNull();

    expect(release).not.toThrow();
  });
});
