import {
  setGlobalLogCollector,
  unsetGlobalLogCollector,
} from '@holz/log-collector';
import type { Log } from '@lib/observability';
import { PortRpc } from '@lib/messaging/channel';

type Api = {
  requests: { add(params: { left: number; right: number }): number };
  events: { log(params: { message: string }): void };
};
type Empty = { requests: Record<string, never>; events: Record<string, never> };

const captureLogs = (): Log[] => {
  const logs: Log[] = [];
  setGlobalLogCollector({
    processor: (log) => {
      logs.push(log);
    },
  });
  return logs;
};

/**
 * Stand up one RPC endpoint over a real `MessageChannel` and hand back the
 * raw far port so tests can feed it arbitrary wire messages — including the
 * malformed ones a well-typed caller could never produce.
 *
 * `flush` round-trips a real request and resolves once its response returns.
 * The port is FIFO, so anything posted before it has already been handled.
 */
const setup = () => {
  const { port1, port2 } = new MessageChannel();
  const endpoint = new PortRpc<Api, Empty>(port2, {
    requests: { add: ({ left, right }) => left + right },
    events: { log: () => undefined },
  });
  port1.start();
  port2.start();

  let nextBarrierId = 1000;
  const post = (message: unknown): void => port1.postMessage(message);
  const flush = (): Promise<void> =>
    new Promise((resolve) => {
      const id = nextBarrierId++;
      const onMessage = (event: MessageEvent): void => {
        const data = event.data as { type?: string; id?: number };
        if (data.type === 'response' && data.id === id) {
          port1.removeEventListener('message', onMessage);
          resolve();
        }
      };
      port1.addEventListener('message', onMessage);
      post({
        type: 'request',
        id,
        method: 'add',
        params: { left: 0, right: 0 },
      });
    });

  return { post, flush, endpoint };
};

describe('RPC logging', () => {
  afterEach(() => {
    unsetGlobalLogCollector();
  });

  it('traces every inbound request', async () => {
    const logs = captureLogs();
    const { flush } = setup();

    await flush(); // the barrier is itself an inbound request

    const trace = logs.find((log) => log.message === 'Inbound request');
    expect(trace?.level).toBe(10);
    expect(trace?.context).toMatchObject({ method: 'add' });
  });

  it('traces every inbound event', async () => {
    const logs = captureLogs();
    const { post, flush } = setup();

    post({ type: 'event', method: 'log', params: { message: 'hi' } });
    await flush();

    const trace = logs.find((log) => log.message === 'Inbound event');
    expect(trace?.level).toBe(10);
    expect(trace?.context).toMatchObject({ method: 'log' });
  });

  it('warns on an event with no handler', async () => {
    const logs = captureLogs();
    const { post, flush } = setup();

    post({ type: 'event', method: 'missing', params: {} });
    await flush();

    const warn = logs.find((log) => log.message === 'Unhandled event');
    expect(warn?.level).toBe(40);
    expect(warn?.context).toMatchObject({ method: 'missing' });
  });

  it('warns on a response with no pending request', async () => {
    const logs = captureLogs();
    const { post, flush } = setup();

    post({ type: 'response', id: 99999, ok: true, result: 1 });
    await flush();

    const warn = logs.find((log) => log.message === 'Unhandled response');
    expect(warn?.level).toBe(40);
    expect(warn?.context).toMatchObject({ id: 99999 });
  });
});
