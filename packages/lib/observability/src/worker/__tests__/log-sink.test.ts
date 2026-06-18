import { createWorkerSink } from '../log-sink.ts';
import type { LogLocation } from '../rpc.ts';

const location: LogLocation = { directory: 'logs', file: 'session.ndjson' };

// The worker's own-log readable, swapped for a controllable source so a test
// can assert it tees into the durable sink. Hoisted so the `vi.mock` factory
// (which runs before the module body) can reach it.
const mockSelfLog = vi.hoisted(() => ({ chunks: [] as Uint8Array[] }));

vi.mock('../../logging/self-log.ts', () => ({
  getSelfLog: () => ({
    backend: () => undefined,
    readable: new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of mockSelfLog.chunks) controller.enqueue(chunk);
        controller.close();
      },
    }),
  }),
}));

const fakeDurable = () => {
  const writes: Uint8Array[] = [];
  return {
    writes,
    write: vi.fn<(chunk: Uint8Array) => void>((chunk) => {
      writes.push(chunk);
    }),
    flush: vi.fn<() => void>(),
  };
};

const writeChunk = async (
  stream: WritableStream<Uint8Array>,
  chunk: Uint8Array,
): Promise<void> => {
  const writer = stream.getWriter();
  await writer.write(chunk);
  writer.releaseLock();
};

beforeEach(() => {
  mockSelfLog.chunks = [];
});

describe('createWorkerSink', () => {
  it('opens the durable log once across repeated opens', async () => {
    const durable = fakeDurable();
    const openDurable = vi.fn(() => Promise.resolve(durable));
    const sink = createWorkerSink(openDurable);

    await sink.open(location);
    await sink.open(location);

    expect(openDurable).toHaveBeenCalledTimes(1);
  });

  it('routes every producer into the one durable log', async () => {
    const durable = fakeDurable();
    const sink = createWorkerSink(() => Promise.resolve(durable));

    const first = await sink.open(location);
    const second = await sink.open(location);
    await writeChunk(first, new Uint8Array([1]));
    await writeChunk(second, new Uint8Array([2]));

    expect(durable.writes).toEqual([new Uint8Array([1]), new Uint8Array([2])]);
  });

  it("tees the worker's own logs into the durable log", async () => {
    mockSelfLog.chunks = [new Uint8Array([9])];
    const durable = fakeDurable();
    const sink = createWorkerSink(() => Promise.resolve(durable));

    await sink.open(location);

    await vi.waitFor(() =>
      expect(durable.writes).toContainEqual(new Uint8Array([9])),
    );
  });

  it('flushes the opened durable log', async () => {
    const durable = fakeDurable();
    const sink = createWorkerSink(() => Promise.resolve(durable));

    await sink.open(location);
    sink.flush();

    expect(durable.flush).toHaveBeenCalledTimes(1);
  });

  it('ignores flush before the durable log opens', () => {
    const sink = createWorkerSink(() => Promise.resolve(fakeDurable()));

    expect(() => sink.flush()).not.toThrow();
  });
});
