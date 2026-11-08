import { configure, type TracerConfig } from '../tracer';

const setup = (overrides?: Partial<TracerConfig>) =>
  configure({
    getCurrentTime: () => 1_000,
    processor: vi.fn(),
    holz: { processor: vi.fn() },
    ...overrides,
  });

describe('configure', () => {
  it('exposes the configured getCurrentTime', () => {
    const getCurrentTime = () => 1_000;
    const tracer = setup({ getCurrentTime });

    expect(tracer.getCurrentTime).toBe(getCurrentTime);
  });
});

describe('tracer.span', () => {
  it('creates a span with the given name', () => {
    expect(setup().span('load-page').name).toBe('load-page');
  });

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
