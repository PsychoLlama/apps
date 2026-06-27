import type { NdjsonBuffer } from '../../ndjson-buffer';
import { createWorkerSink } from '../log-sink';
import type { LogLocation } from '../rpc';

const location: LogLocation = { directory: 'logs', file: 'session.ndjson' };

// A worker-log buffer whose readable replays a fixed set of chunks, so a test
// can assert the worker's own logs tee into the durable sink. Passed to
// `createWorkerSink` as the injected buffer getter — no module mock, and a
// fresh buffer per test.
const workerLogBuffer =
  (chunks: Uint8Array[] = []): (() => NdjsonBuffer) =>
  () => ({
    backend: () => undefined,
    readable: new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      },
    }),
  });

const fakeDurable = (onWrite?: (chunk: Uint8Array) => void) => {
  const writes: Uint8Array[] = [];
  return {
    writes,
    write: vi.fn<(chunk: Uint8Array) => void>((chunk) => {
      writes.push(chunk);
      onWrite?.(chunk);
    }),
    flush: vi.fn<() => void>(),
  };
};

describe('createWorkerSink', () => {
  it('opens the durable log once across repeated opens', async () => {
    const durable = fakeDurable();
    const openDurable = vi.fn(() => Promise.resolve(durable));
    const sink = createWorkerSink(openDurable, workerLogBuffer());

    await sink.open(location);
    await sink.open(location);

    expect(openDurable).toHaveBeenCalledTimes(1);
  });

  it('writes streamed lines into the durable log in order', async () => {
    const durable = fakeDurable();
    const sink = createWorkerSink(
      () => Promise.resolve(durable),
      workerLogBuffer(),
    );

    await sink.open(location);
    sink.write(new Uint8Array([1]));
    sink.write(new Uint8Array([2]));

    expect(durable.writes).toEqual([new Uint8Array([1]), new Uint8Array([2])]);
  });

  it('queues a line that races ahead of the open, then drains it on open', async () => {
    const durable = fakeDurable();
    const sink = createWorkerSink(
      () => Promise.resolve(durable),
      workerLogBuffer(),
    );

    // Write before awaiting `open`: the durable is still opening, so the line
    // queues rather than landing — nothing is written yet.
    const opened = sink.open(location);
    sink.write(new Uint8Array([7]));
    expect(durable.writes).toEqual([]);

    // Opening drains the queue before it resolves, so awaiting it is an exact
    // hook for "the queued line has landed" — no polling.
    await opened;
    expect(durable.writes).toEqual([new Uint8Array([7])]);
  });

  it("tees the worker's own logs into the durable log", async () => {
    // The tee is a live stream drain we can't await through `open`. Resolve the
    // instant the durable receives the teed line — an exact hook for "it
    // landed" rather than polling for it to appear.
    let teed!: () => void;
    const drained = new Promise<void>((resolve) => {
      teed = resolve;
    });
    const durable = fakeDurable(() => teed());
    const sink = createWorkerSink(
      () => Promise.resolve(durable),
      workerLogBuffer([new Uint8Array([9])]),
    );

    await sink.open(location);
    await drained;

    expect(durable.writes).toContainEqual(new Uint8Array([9]));
  });

  it('flushes the opened durable log', async () => {
    const durable = fakeDurable();
    const sink = createWorkerSink(
      () => Promise.resolve(durable),
      workerLogBuffer(),
    );

    await sink.open(location);
    sink.flush();

    expect(durable.flush).toHaveBeenCalledTimes(1);
  });

  it('ignores flush before the durable log opens', () => {
    const sink = createWorkerSink(
      () => Promise.resolve(fakeDurable()),
      workerLogBuffer(),
    );

    expect(() => sink.flush()).not.toThrow();
  });
});
