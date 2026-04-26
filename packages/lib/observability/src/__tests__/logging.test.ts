import { context, trace } from '@opentelemetry/api';
import { logs } from '@opentelemetry/api-logs';
import { createLogger } from '../logging';
import { configure } from '../setup';

beforeEach(() => {
  vi.restoreAllMocks();
  logs.disable();
  trace.disable();
  context.disable();
  configure({ logs: 'console' });
});

describe('createLogger', () => {
  it('routes each level method to the matching console method', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});

    const log = createLogger('test');
    log.error('e');
    log.warn('w');
    log.info('i');
    log.debug('d');

    expect(error).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledOnce();
    expect(info).toHaveBeenCalledOnce();
    expect(debug).toHaveBeenCalledOnce();
  });

  it('passes the body and attributes through to the underlying emit', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    createLogger('app.test').info('hello', { user: 'alice' });
    const args = spy.mock.calls[0] as [string, string, Record<string, unknown>];
    expect(args[0]).toBe('[INFO] app.test');
    expect(args[1]).toBe('hello');
    expect(args[2]).toEqual({ user: 'alice' });
  });

  it('omits attributes when none given', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    createLogger('test').info('hello');
    const args = spy.mock.calls[0] as [string, string, undefined];
    expect(args[2]).toBeUndefined();
  });
});
