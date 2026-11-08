import { createContext, type TracerConfig } from '../config';
import { createSpan } from '../span';

const setup = (overrides?: Partial<TracerConfig>) =>
  createContext({
    getCurrentTime: () => 1_000,
    processor: vi.fn(),
    holz: { processor: vi.fn() },
    ...overrides,
  });

describe('createSpan', () => {
  it('draws OTel-sized IDs from the random source', () => {
    const getRandomBytes = (count: number) => new Uint8Array(count).fill(count);
    const span = createSpan('load-page', setup({ getRandomBytes }));

    expect(span.traceId).toEqual(new Uint8Array(16).fill(16));
    expect(span.spanId).toEqual(new Uint8Array(8).fill(8));
  });

  it('starts a new trace for each root span', () => {
    const context = setup();
    const first = createSpan('first', context);
    const second = createSpan('second', context);

    expect(first.traceId).not.toEqual(second.traceId);
  });
});

describe('span.child', () => {
  it('passes each child to the processor', () => {
    const context = setup();
    const child = createSpan('load-page', context).child('fetch-config');

    expect(context.processor).toHaveBeenLastCalledWith(child);
  });

  it('supports nesting beyond one level', () => {
    const context = setup();

    createSpan('a', context).child('b').child('c');

    expect(context.processor).toHaveBeenCalledTimes(3);
  });

  it('inherits the trace ID', () => {
    const parent = createSpan('parent', setup());

    expect(parent.child('child').traceId).toEqual(parent.traceId);
  });

  it('gets its own span ID', () => {
    const parent = createSpan('parent', setup());

    expect(parent.child('child').spanId).not.toEqual(parent.spanId);
  });
});
