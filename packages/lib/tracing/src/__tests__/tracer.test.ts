import type { TracerConfig } from '../config';
import { configure } from '../tracer';

const setup = (overrides?: Partial<TracerConfig>) =>
  configure({
    getCurrentTime: () => 1_000,
    processor: vi.fn(),
    holz: { processor: vi.fn() },
    ...overrides,
  });

describe('tracer.span', () => {
  it('passes each new span to the processor', () => {
    const processor = vi.fn();
    const span = setup({ processor }).span('load-page');

    expect(processor).toHaveBeenCalledExactlyOnceWith(span);
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
