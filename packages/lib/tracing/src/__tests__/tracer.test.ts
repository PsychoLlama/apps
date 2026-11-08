import { configure } from '../tracer';

describe('configure', () => {
  it('exposes the configured getCurrentTime', () => {
    const getCurrentTime = () => 1_000;
    const tracer = configure({ getCurrentTime, holz: { processor: vi.fn() } });

    expect(tracer.getCurrentTime).toBe(getCurrentTime);
  });
});

describe('tracer.span', () => {
  it('creates a span with the given name', () => {
    const tracer = configure({
      getCurrentTime: () => 1_000,
      holz: { processor: vi.fn() },
    });

    expect(tracer.span('load-page').name).toBe('load-page');
  });

  it('sends span logs to the configured processor', () => {
    const processor = vi.fn();
    const tracer = configure({
      getCurrentTime: () => 1_000,
      holz: { processor },
    });

    tracer.span('load-page').log.info('loaded');

    expect(processor).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ message: 'loaded' }),
    );
  });
});
