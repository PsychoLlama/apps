import {
  RpcError,
  RpcPeer,
  type Channel,
  type MessageHandler,
  type RpcMessage,
} from '@lib/messaging';

type ServerApi = {
  requests: {
    add(params: { left: number; right: number }): number;
    divide(params: { left: number; right: number }): Promise<number>;
    boom(params: { message: string }): number;
  };
  notifications: {
    log(params: { message: string }): void;
  };
};

type ClientApi = {
  requests: Record<string, never>;
  notifications: Record<string, never>;
};

/**
 * A pair of in-memory channels wired together: a message sent on one is
 * delivered synchronously to the other's handlers. Stands in for a real
 * transport (e.g. two `MessageChannel` ports).
 */
const createLoopback = () => {
  const aliceHandlers = new Set<MessageHandler<RpcMessage>>();
  const bobHandlers = new Set<MessageHandler<RpcMessage>>();

  const alice: Channel<RpcMessage, RpcMessage> = {
    send: (message) => {
      for (const handler of bobHandlers) handler(message);
    },
    onMessage: (handler) => {
      aliceHandlers.add(handler);
    },
  };
  const bob: Channel<RpcMessage, RpcMessage> = {
    send: (message) => {
      for (const handler of aliceHandlers) handler(message);
    },
    onMessage: (handler) => {
      bobHandlers.add(handler);
    },
  };

  return { alice, bob };
};

const setup = () => {
  const { alice, bob } = createLoopback();
  const logged: string[] = [];

  const server = new RpcPeer<ServerApi, ClientApi>(alice, {
    requests: {
      add: ({ left, right }) => left + right,
      divide: ({ left, right }) => Promise.resolve(left / right),
      boom: ({ message }) => {
        throw new Error(message);
      },
    },
    notifications: {
      log: ({ message }) => {
        logged.push(message);
      },
    },
  });

  const client = new RpcPeer<ClientApi, ServerApi>(bob, {
    requests: {},
    notifications: {},
  });

  return { server, client, logged };
};

describe('RpcPeer', () => {
  it('resolves a request with the remote handler result', async () => {
    const { client } = setup();

    await expect(client.request('add', { left: 2, right: 3 })).resolves.toBe(5);
  });

  it('awaits async request handlers', async () => {
    const { client } = setup();

    await expect(
      client.request('divide', { left: 10, right: 2 }),
    ).resolves.toBe(5);
  });

  it('correlates concurrent requests to their own results', async () => {
    const { client } = setup();

    const [sum, quotient] = await Promise.all([
      client.request('add', { left: 1, right: 1 }),
      client.request('divide', { left: 9, right: 3 }),
    ]);

    expect(sum).toBe(2);
    expect(quotient).toBe(3);
  });

  it('rejects with an RpcError when the remote handler throws', async () => {
    const { client } = setup();

    await expect(
      client.request('boom', { message: 'kaboom' }),
    ).rejects.toBeInstanceOf(RpcError);
    await expect(client.request('boom', { message: 'kaboom' })).rejects.toThrow(
      'kaboom',
    );
  });

  it('delivers notifications without a response', () => {
    const { client, logged } = setup();

    client.notify('log', { message: 'hello' });

    expect(logged).toEqual(['hello']);
  });

  it('responds with an error for unknown request methods', () => {
    const { alice, bob } = createLoopback();
    new RpcPeer<ServerApi, ClientApi>(alice, {
      requests: {
        add: ({ left, right }) => left + right,
        divide: ({ left, right }) => Promise.resolve(left / right),
        boom: ({ message }) => {
          throw new Error(message);
        },
      },
      notifications: { log: () => {} },
    });

    // Act as a raw peer on the other end to send an off-contract request.
    const responses: RpcMessage[] = [];
    bob.onMessage((message) => responses.push(message));
    bob.send({ type: 'request', id: 1, method: 'nope', params: {} });

    expect(responses).toEqual([
      {
        type: 'response',
        id: 1,
        ok: false,
        error: { message: 'Unknown request method: nope' },
      },
    ]);
  });
});
