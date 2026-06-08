import {
  RPC,
  RpcError,
  type Channel,
  type MessageHandler,
  type RpcMessage,
} from '@lib/messaging';

type ServerApi = {
  requests: {
    add(params: { left: number; right: number }): number;
    divide(params: { left: number; right: number }): Promise<number>;
    boom(params: { message: string }): number;
    denied(params: { resource: string }): number;
  };
  events: {
    log(params: { message: string }): void;
    ping(): void;
  };
};

type ClientApi = {
  requests: Record<string, never>;
  events: Record<string, never>;
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

  const server = RPC.from<ServerApi, ClientApi>(alice, {
    requests: {
      add: ({ left, right }) => left + right,
      divide: ({ left, right }) => Promise.resolve(left / right),
      boom: ({ message }) => {
        throw new Error(message);
      },
      denied: () => {
        throw new RpcError('no access');
      },
    },
    events: {
      log: ({ message }) => {
        logged.push(message);
      },
      ping: () => {
        logged.push('pong');
      },
    },
  });

  const client = RPC.from<ClientApi, ServerApi>(bob, {
    requests: {},
    events: {},
  });

  return { server, client, logged };
};

describe('RPC', () => {
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

  it('rejects with an RpcError when a handler throws', async () => {
    const { client } = setup();

    await expect(
      client.request('boom', { message: 'kaboom' }),
    ).rejects.toBeInstanceOf(RpcError);
    await expect(client.request('boom', { message: 'kaboom' })).rejects.toThrow(
      'kaboom',
    );
  });

  it('propagates a deliberately thrown RpcError message', async () => {
    const { client } = setup();

    await expect(client.request('denied', { resource: 'db' })).rejects.toThrow(
      'no access',
    );
  });

  it('rejects unknown request methods', async () => {
    const { client } = setup();
    // Bypass the type system to call an off-contract method.
    const loose = client as unknown as {
      request(method: string, params: unknown): Promise<unknown>;
    };

    await expect(loose.request('ghost', {})).rejects.toThrow(
      'Unknown request method: ghost',
    );
  });

  it('delivers an event with a payload', () => {
    const { client, logged } = setup();

    client.notify('log', { message: 'hello' });

    expect(logged).toEqual(['hello']);
  });

  it('delivers a zero-argument event', () => {
    const { client, logged } = setup();

    client.notify('ping');

    expect(logged).toEqual(['pong']);
  });

  it('type-checks request and notify calls', () => {
    // Compile-only assertions — never executed, so no real calls fire.
    const checks = (client: RPC<ClientApi, ServerApi>) => {
      // @ts-expect-error - params must match the method signature
      void client.request('add', { left: 1 });
      // @ts-expect-error - unknown request method
      void client.request('ghost', { left: 1, right: 2 });
      // @ts-expect-error - notify targets events, not requests
      client.notify('add', { left: 1, right: 2 });
      // @ts-expect-error - log requires its params payload
      client.notify('log');

      // Valid: a zero-argument event needs no payload.
      client.notify('ping');
    };

    expect(typeof checks).toBe('function');
  });

  it('rejects procedures that take more than one argument', () => {
    const { alice } = createLoopback();
    type TwoArg = {
      requests: { sum(first: number, second: number): number };
      events: Record<string, never>;
    };

    // @ts-expect-error - procedures take at most one argument
    RPC.from<TwoArg, ClientApi>(alice, {
      requests: { sum: (first, second) => first + second },
      events: {},
    });

    expect(true).toBe(true);
  });
});
