import { type Log, type LogProcessor, createLogger } from '@holz/core';
import type { ResolvedConfig, ViteDevServer } from 'vite';
import { LOG_EVENT } from '../protocol/events.ts';
import { type SerializedLog, serializeLog } from '../protocol/serialization.ts';
import { holz } from '../server.ts';

type Listener = (log: SerializedLog) => void;

type Hook = (...args: unknown[]) => unknown;

// Stands in for the dev server: runs the hooks in Vite's order against just
// enough surface, with a hook to play messages arriving from the browser.
const startServer = async (createProcessor: Parameters<typeof holz>[0]) => {
  const listeners = new Map<string, Listener>();
  const logger = {
    error: vi.fn<(message: string, options?: { error?: Error }) => void>(),
  };
  const config = { root: '/app', logger } as unknown as ResolvedConfig;
  const server = {
    config,
    environments: {
      client: {
        hot: { on: (event: string, fn: Listener) => listeners.set(event, fn) },
      },
    },
  } as unknown as ViteDevServer;

  const plugin = holz(createProcessor);
  await (plugin.config as Hook)({}, { command: 'serve', mode: 'development' });
  await (plugin.configResolved as Hook)(config);
  (plugin.configureServer as Hook)(server);

  const receive = (log: Log) => listeners.get(LOG_EVENT)?.(serializeLog(log));

  return { logger, receive };
};

const capture = (emit: (logger: ReturnType<typeof createLogger>) => void) => {
  const logs: Log[] = [];
  emit(createLogger((log) => logs.push(log)));

  return logs[0];
};

const createNoop = async (): Promise<LogProcessor> => () => {};

class SetupFailure extends Error {}
class ProcessorFailure extends Error {}

describe('holz', () => {
  it('only applies to the dev server', () => {
    expect(holz(createNoop).apply).toBe('serve');
  });

  it('disables console forwarding by default', async () => {
    const plugin = holz(createNoop);
    const result = await (plugin.config as Hook)(
      {},
      { command: 'serve', mode: 'development' },
    );

    expect(result).toEqual({ server: { forwardConsole: false } });
  });

  it('respects an explicit console forwarding setting', async () => {
    const plugin = holz(createNoop);
    const result = await (plugin.config as Hook)(
      { server: { forwardConsole: true } },
      { command: 'serve', mode: 'development' },
    );

    expect(result).toBeUndefined();
  });

  it('hands hydrated logs to the processor', async () => {
    const processor = vi.fn<LogProcessor>();
    const { receive } = await startServer(async () => processor);
    const error = new TypeError('boom');

    receive(capture((logger) => logger.error('failed', { error })));

    expect(processor).toHaveBeenCalledOnce();
    expect(processor.mock.calls[0][0].message).toBe('failed');
    expect(processor.mock.calls[0][0].context.error).toBeInstanceOf(TypeError);
  });

  it('creates the processor once, before the server starts', async () => {
    const createProcessor = vi.fn(createNoop);
    const { receive } = await startServer(createProcessor);

    receive(capture((logger) => logger.info('one')));
    receive(capture((logger) => logger.info('two')));

    expect(createProcessor).toHaveBeenCalledOnce();
  });

  it("passes Vite's resolved config to the function", async () => {
    const createProcessor =
      vi.fn<(config: ResolvedConfig) => Promise<LogProcessor>>(createNoop);
    await startServer(createProcessor);

    expect(createProcessor.mock.calls[0][0].root).toBe('/app');
  });

  it('accepts a synchronous function', async () => {
    const processor = vi.fn<LogProcessor>();
    const { receive } = await startServer(() => processor);

    receive(capture((logger) => logger.info('hello')));

    expect(processor).toHaveBeenCalledOnce();
  });

  it('waits for an asynchronous function', async () => {
    const processor = vi.fn<LogProcessor>();
    const { receive } = await startServer(async () => {
      await Promise.resolve();
      return processor;
    });

    receive(capture((logger) => logger.info('hello')));

    expect(processor).toHaveBeenCalledOnce();
  });

  it('fails to start when the function rejects', async () => {
    await expect(
      startServer(() => Promise.reject(new SetupFailure())),
    ).rejects.toBeInstanceOf(SetupFailure);
  });

  it('fails to start when the function throws', async () => {
    await expect(
      startServer(() => {
        throw new SetupFailure();
      }),
    ).rejects.toBeInstanceOf(SetupFailure);
  });

  it('reports a processor that throws and keeps going', async () => {
    const messages: string[] = [];
    const { logger, receive } = await startServer(async () => (log) => {
      if (log.message === 'bad') throw new ProcessorFailure('cannot cope');
      messages.push(log.message);
    });

    receive(capture((logger) => logger.info('bad')));
    receive(capture((logger) => logger.info('good')));

    expect(logger.error).toHaveBeenCalledOnce();
    const [message, options] = logger.error.mock.calls[0];
    expect(message).toContain('Log processor threw');

    // Vite only prints the message, so the error must be inlined into it.
    expect(message).toContain('cannot cope');
    expect(message).toContain('server.test.ts');
    expect(options?.error).toBeInstanceOf(ProcessorFailure);
    expect(messages).toEqual(['good']);
  });
});
