import { createLogger } from '@holz/core';
import { queueUntilConnected } from '../service-worker.ts';
import type { DevSocket } from '../vite-backend.ts';

// Stands in for `import.meta.hot`, with a hook to fire socket events.
const setup = () => {
  const listeners = new Map<string, () => void>();
  const socket = {
    on: (event: string, fn: () => void) => listeners.set(event, fn),
  } as unknown as DevSocket;

  const sent: string[] = [];
  const processor = queueUntilConnected(socket, (log) => {
    sent.push(log.message);
  });

  const emit = (event: string) => listeners.get(event)?.();
  const logger = createLogger(processor);

  return { emit, logger, sent };
};

describe('queueUntilConnected', () => {
  it('holds logs until the socket connects', () => {
    const { emit, logger, sent } = setup();

    logger.info('a');
    logger.info('b');
    expect(sent).toEqual([]);

    emit('vite:ws:connect');
    expect(sent).toEqual(['a', 'b']);
  });

  it('sends straight through once connected', () => {
    const { emit, logger, sent } = setup();

    emit('vite:ws:connect');
    logger.info('a');

    expect(sent).toEqual(['a']);
  });

  it('keeps only the newest 100 logs while connecting', () => {
    const { emit, logger, sent } = setup();
    const messages = Array.from(Array(150).keys(), (index) => `log-${index}`);

    for (const message of messages) logger.info(message);
    emit('vite:ws:connect');

    expect(sent).toEqual(messages.slice(-100));
  });

  it('drops logs after the socket disconnects', () => {
    const { emit, logger, sent } = setup();

    emit('vite:ws:connect');
    emit('vite:ws:disconnect');
    logger.info('a');

    expect(sent).toEqual([]);
  });
});
