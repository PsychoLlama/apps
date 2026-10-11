/**
 * Unit tests for the decoder worker's place in state: the fold that attaches
 * a live connection, and the lifetime guarantee that no worker outlives the
 * page. Nothing here spawns a real worker — the connection is a pair of
 * spies.
 */

import { createTestRuntime } from '@lib/state';
import { decoderCell, decoderReadyTopic } from '../decoder';
import { scannerScope } from '../scope';
import type { DecoderConnection } from '../../decoder';

/** A connection stand-in whose teardown calls are observable. */
const fakeConnection = (
  close = vi.fn(),
  terminate = vi.fn(),
): DecoderConnection =>
  ({ rpc: { close }, worker: { terminate } }) as unknown as DecoderConnection;

const setup = () => {
  const runtime = createTestRuntime();
  const release = runtime.anchor(scannerScope);
  return { ...runtime, release };
};

describe('decoderCell', () => {
  it('holds no connection before the preload lands', () => {
    const { peek } = setup();

    expect(peek(decoderCell)).toBeNull();
  });
});

describe('decoderReadyTopic', () => {
  it('holds the connection itself', () => {
    const { commit, peek } = setup();
    const connection = fakeConnection();

    commit(decoderReadyTopic(connection));

    // Identity, not deep equality: a proxied `Worker` traps on every call.
    expect(peek(decoderCell)).toBe(connection);
  });
});

describe('scannerScope', () => {
  it('terminates the worker when the last anchor is released', () => {
    const close = vi.fn();
    const terminate = vi.fn();
    const { commit, release } = setup();
    commit(decoderReadyTopic(fakeConnection(close, terminate)));

    release();

    // The RPC closes first so a frame still in flight rejects before the
    // thread is reclaimed.
    expect(close).toHaveBeenCalledOnce();
    expect(terminate).toHaveBeenCalledOnce();
  });

  it('has nothing to terminate when the preload never landed', () => {
    const { peek, release } = setup();
    // Touch the cell so it materializes and its drop hook actually runs.
    expect(peek(decoderCell)).toBeNull();

    expect(release).not.toThrow();
  });
});
