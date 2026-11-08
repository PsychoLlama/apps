import type { TracerConfig } from '../config';
import { configure } from '../tracer';

describe('tracer', () => {
  const setup = (overrides?: Partial<TracerConfig>) =>
    configure({
      getCurrentTime: () => 1_000,
      processor: vi.fn(),
      holz: { processor: vi.fn() },
      ...overrides,
    });

  describe('span', () => {
    it('passes each new span to the processor', () => {
      const processor = vi.fn();

      setup({ processor }).span('load-page');

      expect(processor).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ name: 'load-page' }),
      );
    });

    it('draws the trace ID from the random source', () => {
      const processor = vi.fn();
      const getRandomBytes = (count: number) =>
        new Uint8Array(count).fill(count);

      setup({ processor, getRandomBytes }).span('load-page');

      expect(processor).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ traceId: new Uint8Array(16).fill(16) }),
      );
    });

    it('starts a new trace for each root span', () => {
      const traceIds: Uint8Array[] = [];
      const tracer = setup({
        processor: (span) => {
          traceIds.push(span.traceId);
          return vi.fn();
        },
      });

      tracer.span('first');
      tracer.span('second');

      expect(traceIds[1]).not.toEqual(traceIds[0]);
    });

    it('sends span logs to the configured log processor', () => {
      const logProcessor = vi.fn();
      const tracer = setup({ holz: { processor: logProcessor } });

      tracer.span('load-page').log.info('loaded');

      expect(logProcessor).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ message: 'loaded' }),
      );
    });
  });
});
