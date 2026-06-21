import {
  createWorkerHandlers,
  type LogLocation,
  type WorkerSink,
} from '../rpc';

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

const stubStream = (): WritableStream<Uint8Array> => new WritableStream();

// Wire the handlers over a sink that hands back `streams` in order, so a test
// can open more than one producer and check which the handlers transfer.
const setup = (streams: WritableStream<Uint8Array>[] = [stubStream()]) => {
  let index = 0;
  const sink: WorkerSink = {
    open: vi.fn(() => Promise.resolve(streams[index++])),
    flush: vi.fn(),
  };
  const handlers = createWorkerHandlers(sink) as unknown as RawHandlers;
  return { handlers, sink, streams };
};

describe('createWorkerHandlers', () => {
  it('opens the sink and transfers its writable stream on init', async () => {
    const { handlers, sink, streams } = setup();
    const options: { transfer?: unknown[] } = {};

    const stream = await handlers.requests.init(location, options);

    expect(sink.open).toHaveBeenCalledWith(location);
    expect(stream).toBe(streams[0]);
    expect(options.transfer).toEqual([streams[0]]);
  });

  it('forwards the flush event to the sink', () => {
    const { handlers, sink } = setup();

    handlers.events.flush();

    expect(sink.flush).toHaveBeenCalledTimes(1);
  });
});
