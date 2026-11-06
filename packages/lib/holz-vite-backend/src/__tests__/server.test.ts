import { type Log, type LogProcessor, createLogger } from '@holz/core';
import type { ViteDevServer } from 'vite';
import { LOG_EVENT } from '../protocol/events.ts';
import { type SerializedLog, serializeLog } from '../protocol/serialization.ts';
import { type HolzConfig, holz } from '../server.ts';

type Listener = (log: SerializedLog) => void;

type Hook = (...args: unknown[]) => unknown;

// Stands in for the dev server: runs the hooks in Vite's order against just
// enough surface, with a hook to play messages arriving from the browser.
const startServer = async (
  getConfig: () => HolzConfig | Promise<HolzConfig>,
) => {
  const listeners = new Map<string, Listener>();
  const logger = {
    error: vi.fn<(message: string, options?: { error?: Error }) => void>(),
  };
  const server = {
    config: { logger },
    environments: {
      client: {
        hot: { on: (event: string, fn: Listener) => listeners.set(event, fn) },
      },
    },
  } as unknown as ViteDevServer;

  const plugin = holz(getConfig);
  await (plugin.config as Hook)({}, { command: 'serve', mode: 'development' });
  (plugin.configureServer as Hook)(server);

  const receive = (log: Log) => listeners.get(LOG_EVENT)?.(serializeLog(log));

  return { logger, receive };
};

const capture = (emit: (logger: ReturnType<typeof createLogger>) => void) => {
  const logs: Log[] = [];
  emit(createLogger((log) => logs.push(log)));

  return logs[0];
};

class ConfigFailure extends Error {}
class ProcessorFailure extends Error {}

describe('holz', () => {
  it('only applies to the dev server', () => {
    expect(holz(() => ({ processor: () => {} })).apply).toBe('serve');
  });

  it('hands hydrated logs to the processor', async () => {
    const processor = vi.fn<LogProcessor>();
    const { receive } = await startServer(() => ({ processor }));
    const error = new TypeError('boom');

    receive(capture((logger) => logger.error('failed', { error })));

    expect(processor).toHaveBeenCalledOnce();
    expect(processor.mock.calls[0][0].message).toBe('failed');
    expect(processor.mock.calls[0][0].context.error).toBeInstanceOf(TypeError);
  });

  it('loads the config once, before the server starts', async () => {
    const getConfig = vi.fn(() => ({ processor: () => {} }));
    const { receive } = await startServer(getConfig);

    receive(capture((logger) => logger.info('one')));
    receive(capture((logger) => logger.info('two')));

    expect(getConfig).toHaveBeenCalledOnce();
  });

  it('waits for an async config', async () => {
    const processor = vi.fn<LogProcessor>();
    const { receive } = await startServer(async () => {
      await Promise.resolve();
      return { processor };
    });

    receive(capture((logger) => logger.info('hello')));

    expect(processor).toHaveBeenCalledOnce();
  });

  it('fails to start when the config fails to load', async () => {
    await expect(
      startServer(() => {
        throw new ConfigFailure();
      }),
    ).rejects.toBeInstanceOf(ConfigFailure);
  });

  it('reports a processor that throws and keeps going', async () => {
    const messages: string[] = [];
    const { logger, receive } = await startServer(() => ({
      processor: (log) => {
        if (log.message === 'bad') throw new ProcessorFailure('cannot cope');
        messages.push(log.message);
      },
    }));

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
