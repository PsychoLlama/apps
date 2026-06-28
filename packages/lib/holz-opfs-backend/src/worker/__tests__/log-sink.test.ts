import { createWorkerSink } from '../log-sink';

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

describe('createWorkerSink', () => {
  it('opens the durable log once across repeated opens', async () => {
    const durable = fakeDurable();
    const openDurable = vi.fn(() => Promise.resolve(durable));
    const sink = createWorkerSink(openDurable);

    await sink.open();
    await sink.open();

    expect(openDurable).toHaveBeenCalledTimes(1);
  });

  it('writes forwarded lines into the durable log in order', async () => {
    const durable = fakeDurable();
    const sink = createWorkerSink(() => Promise.resolve(durable));

    await sink.open();
    sink.write(new Uint8Array([1]));
    sink.write(new Uint8Array([2]));

    expect(durable.writes).toEqual([new Uint8Array([1]), new Uint8Array([2])]);
  });

  it('queues a line that races ahead of the open, then drains it on open', async () => {
    const durable = fakeDurable();
    const sink = createWorkerSink(() => Promise.resolve(durable));

    // Write before awaiting `open`: the durable is still opening, so the line
    // queues rather than landing — nothing is written yet.
    const opened = sink.open();
    sink.write(new Uint8Array([7]));
    expect(durable.writes).toEqual([]);

    // Opening drains the queue before it resolves, so awaiting it is an exact
    // hook for "the queued line has landed" — no polling.
    await opened;
    expect(durable.writes).toEqual([new Uint8Array([7])]);
  });

  it('flushes the opened durable log', async () => {
    const durable = fakeDurable();
    const sink = createWorkerSink(() => Promise.resolve(durable));

    await sink.open();
    sink.flush();

    expect(durable.flush).toHaveBeenCalledTimes(1);
  });

  it('ignores flush before the durable log opens', () => {
    const sink = createWorkerSink(() => Promise.resolve(fakeDurable()));

    expect(() => sink.flush()).not.toThrow();
  });
});
