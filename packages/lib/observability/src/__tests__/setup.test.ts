import { context, trace } from '@opentelemetry/api';
import { logs, SeverityNumber, type Logger } from '@opentelemetry/api-logs';
import { configure } from '../setup';

beforeEach(() => {
  vi.restoreAllMocks();
  logs.disable();
  trace.disable();
  context.disable();
});

describe('configure', () => {
  it('defaults to the console provider when called with no options', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    configure();
    logs.getLogger('test').emit({ body: 'hello' });
    expect(spy).toHaveBeenCalled();
  });

  it('accepts an explicit LoggerProvider', () => {
    const emit = vi.fn();
    const logger: Logger = { emit, enabled: () => true };
    configure({ logs: { getLogger: () => logger } });
    logs.getLogger('test').emit({ body: 'x' });
    expect(emit).toHaveBeenCalledWith({ body: 'x' });
  });
});

describe('console provider', () => {
  beforeEach(() => {
    configure({ logs: 'console' });
  });

  it.each([
    [SeverityNumber.ERROR, 'error'],
    [SeverityNumber.WARN, 'warn'],
    [SeverityNumber.INFO, 'info'],
    [SeverityNumber.DEBUG, 'debug'],
  ] as const)('routes severity %d to console.%s', (severity, method) => {
    const spy = vi.spyOn(console, method).mockImplementation(() => {});
    logs.getLogger('test').emit({ severityNumber: severity, body: 'msg' });
    expect(spy).toHaveBeenCalled();
  });

  it('treats UNSPECIFIED as INFO', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logs.getLogger('test').emit({ body: 'hello' });
    expect(spy).toHaveBeenCalled();
  });

  it('formats output as `[LEVEL] name`, then body and attributes', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logs.getLogger('app.router').emit({
      severityNumber: SeverityNumber.INFO,
      body: 'navigated',
      attributes: { to: '/studio' },
    });
    expect(spy).toHaveBeenCalledWith('[INFO] app.router', 'navigated', {
      to: '/studio',
    });
  });

  it('reports enabled=true for any logger', () => {
    expect(logs.getLogger('test').enabled()).toBe(true);
  });
});
