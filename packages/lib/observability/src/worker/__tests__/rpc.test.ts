import {
  createWorkerHandlers,
  type LogLocation,
  type LogSink,
} from '../rpc.ts';

const location: LogLocation = { directory: 'logs', file: 'session.ndjson' };

// `defineContract` reduces the handlers to their params-only contract, hiding
// the `options` bag `init` writes `transfer` into. Cast back to the raw handler
// shape so the tests can drive them the way the RPC dispatcher does.
interface RawHandlers {
  requests: {
    init: (
      location: LogLocation,
      options: { transfer?: unknown[] },
    ) => Promise<WritableStream<Uint8Array>>;
  };
  events: { flush: () => void };
}

const stubSink = (): LogSink => ({
  stream: {} as WritableStream<Uint8Array>,
  flush: vi.fn(),
});

// Wire the handlers over a sink factory that hands back `sinks` in order, so a
// test can open more than one session and check which the flush event targets.
const setup = (sinks: LogSink[] = [stubSink()]) => {
  let index = 0;
  const openLogStream = vi.fn(() => Promise.resolve(sinks[index++]));
  const handlers = createWorkerHandlers(
    openLogStream,
  ) as unknown as RawHandlers;
  return { handlers, openLogStream, sinks };
};

describe('createWorkerHandlers', () => {
  it('opens the sink and transfers its writable stream on init', async () => {
    const { handlers, openLogStream, sinks } = setup();
    const options: { transfer?: unknown[] } = {};

    const stream = await handlers.requests.init(location, options);

    expect(openLogStream).toHaveBeenCalledWith(location);
    expect(stream).toBe(sinks[0].stream);
    expect(options.transfer).toEqual([sinks[0].stream]);
  });

  it('flushes the active sink when the host fires the flush event', async () => {
    const { handlers, sinks } = setup();

    await handlers.requests.init(location, {});
    handlers.events.flush();

    expect(sinks[0].flush).toHaveBeenCalledTimes(1);
  });

  it('ignores the flush event before a sink is opened', () => {
    const { handlers, sinks } = setup();

    expect(() => handlers.events.flush()).not.toThrow();
    expect(sinks[0].flush).not.toHaveBeenCalled();
  });

  it('flushes the most recently opened sink', async () => {
    const { handlers, sinks } = setup([stubSink(), stubSink()]);

    await handlers.requests.init(location, {});
    await handlers.requests.init(location, {});
    handlers.events.flush();

    expect(sinks[0].flush).not.toHaveBeenCalled();
    expect(sinks[1].flush).toHaveBeenCalledTimes(1);
  });
});
