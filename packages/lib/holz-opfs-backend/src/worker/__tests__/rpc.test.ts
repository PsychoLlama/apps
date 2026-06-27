import { createWorkerHandlers, type WorkerSink } from '../rpc';

// `defineContract` reduces the handlers to their params-only contract. Cast
// back to the raw handler shape so the tests can drive them the way the RPC
// dispatcher does.
interface RawHandlers {
  requests: Record<never, never>;
  events: {
    log: (chunk: Uint8Array) => void;
    flush: () => void;
  };
}

const setup = () => {
  const sink: WorkerSink = {
    open: vi.fn(() => Promise.resolve()),
    write: vi.fn(),
    flush: vi.fn(),
  };
  const handlers = createWorkerHandlers(sink) as unknown as RawHandlers;
  return { handlers, sink };
};

describe('createWorkerHandlers', () => {
  it('writes a streamed log line to the sink', () => {
    const { handlers, sink } = setup();
    const chunk = new Uint8Array([1, 2, 3]);

    handlers.events.log(chunk);

    expect(sink.write).toHaveBeenCalledWith(chunk);
  });

  it('forwards the flush event to the sink', () => {
    const { handlers, sink } = setup();

    handlers.events.flush();

    expect(sink.flush).toHaveBeenCalledTimes(1);
  });
});
