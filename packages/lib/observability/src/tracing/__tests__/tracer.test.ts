import {
  setGlobalLogCollector,
  unsetGlobalLogCollector,
} from '@holz/log-collector';
import { type Log, tracer } from '@lib/observability';

describe('tracer', () => {
  afterEach(() => {
    unsetGlobalLogCollector();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('leaves the performance timeline alone outside dev mode', async () => {
    const measure = vi.spyOn(performance, 'measure');
    vi.stubEnv('DEV', false);
    vi.resetModules();

    const { tracer: productionTracer } = await import('@lib/observability');
    productionTracer.span('load-page').enter()();

    expect(measure).not.toHaveBeenCalled();
  });

  it('reports finished spans to the performance timeline', () => {
    const measure = vi.spyOn(performance, 'measure');

    tracer.span('load-page').enter()();

    expect(measure).toHaveBeenCalledOnce();
    expect(measure.mock.calls[0]?.[0]).toBe('load-page');
  });

  it('writes span logs to the log processor', () => {
    const logs: Log[] = [];
    setGlobalLogCollector({
      processor: (log) => {
        logs.push(log);
      },
    });

    tracer.span('load-page').log.info('hello');

    expect(logs.map((log) => log.message)).toEqual(['hello']);
  });
});
