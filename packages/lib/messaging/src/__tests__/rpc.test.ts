import { RPC, RpcError, type Channel, type RpcMessage } from '@lib/messaging';
import { fromMessagePort } from '@lib/messaging/channel';

type ServerApi = {
  requests: {
    add(params: { left: number; right: number }): number;
    divide(params: { left: number; right: number }): Promise<number>;
    boom(params: { message: string }): number;
    denied(params: { resource: string }): number;
    echoSize(params: { buffer: ArrayBuffer }): number;
  };
  events: {
    log(params: { message: string }): void;
    ping(): void;
    sink(params: { buffer: ArrayBuffer }): void;
  };
};

type ClientApi = {
  requests: Record<string, never>;
  events: Record<string, never>;
};

// MessagePort delivers asynchronously; let queued messages drain.
const tick = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

/**
 * Wire two RPC peers over a real `MessageChannel` via the adapter under
 * test — no hand-rolled mock transport.
 */
const setup = () => {
  const { port1, port2 } = new MessageChannel();
  const logged: string[] = [];
  const sizes: number[] = [];

  const server = RPC.from<ServerApi, ClientApi>(fromMessagePort(port1), {
    requests: {
      add: ({ left, right }) => left + right,
      divide: ({ left, right }) => Promise.resolve(left / right),
      boom: ({ message }) => {
        throw new Error(message);
      },
      denied: () => {
        throw new RpcError('no access');
      },
      echoSize: ({ buffer }) => buffer.byteLength,
    },
    events: {
      log: ({ message }) => {
        logged.push(message);
      },
      ping: () => {
        logged.push('pong');
      },
      sink: ({ buffer }) => {
        sizes.push(buffer.byteLength);
      },
    },
  });

  const client = RPC.from<ClientApi, ServerApi>(fromMessagePort(port2), {
    requests: {},
    events: {},
  });

  return { server, client, logged, sizes };
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

  it('treats inherited request method names as unknown', async () => {
    const { client } = setup();
    // A hostile peer could name a method after an inherited member
    // (`constructor` resolves to a callable `Object`, `toString` to a
    // function, etc). Only own procedures should be reachable.
    const loose = client as unknown as {
      request(method: string, params: unknown): Promise<unknown>;
    };

    await expect(loose.request('constructor', {})).rejects.toThrow(
      'Unknown request method: constructor',
    );
    await expect(loose.request('__proto__', {})).rejects.toThrow(
      'Unknown request method: __proto__',
    );
    await expect(loose.request('toString', {})).rejects.toThrow(
      'Unknown request method: toString',
    );
  });

  it('drops events named after inherited members', async () => {
    const { client, logged } = setup();
    const loose = client as unknown as {
      notify(method: string, params?: unknown): void;
    };

    loose.notify('constructor', {});
    loose.notify('__proto__', {});
    loose.notify('hasOwnProperty', {});
    await tick();

    expect(logged).toEqual([]);
  });

  it('delivers an event with a payload', async () => {
    const { client, logged } = setup();

    client.notify('log', { message: 'hello' });
    await tick();

    expect(logged).toEqual(['hello']);
  });

  it('delivers a zero-argument event', async () => {
    const { client, logged } = setup();

    client.notify('ping');
    await tick();

    expect(logged).toEqual(['pong']);
  });

  it('transfers an ArrayBuffer alongside a request', async () => {
    const { client } = setup();
    const buffer = new ArrayBuffer(8);

    const size = await client.request(
      'echoSize',
      { buffer },
      { transfer: [buffer] },
    );

    expect(size).toBe(8);
    expect(buffer.byteLength).toBe(0); // neutered in the sender
  });

  it('transfers an ArrayBuffer alongside a notify', async () => {
    const { client, sizes } = setup();
    const buffer = new ArrayBuffer(8);

    client.notify('sink', { buffer }, { transfer: [buffer] });
    await tick();

    expect(sizes).toEqual([8]);
    expect(buffer.byteLength).toBe(0);
  });

  it('throws when transfer is requested on a non-transferable channel', async () => {
    const plain: Channel<RpcMessage, RpcMessage> = {
      send: () => undefined,
      onMessage: () => undefined,
    };
    const client = RPC.from<ClientApi, ServerApi>(plain, {
      requests: {},
      events: {},
    });
    const buffer = new ArrayBuffer(8);

    await expect(
      client.request('echoSize', { buffer }, { transfer: [buffer] }),
    ).rejects.toThrow('does not support transfer');
    expect(() =>
      client.notify('sink', { buffer }, { transfer: [buffer] }),
    ).toThrow('does not support transfer');
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
      // @ts-expect-error - ping takes no argument (nothing to transfer)
      client.notify('ping', {});

      // Valid: zero-argument event needs no payload.
      client.notify('ping');
      // Valid: a payload procedure accepts transfer options.
      void client.request(
        'echoSize',
        { buffer: new ArrayBuffer(1) },
        { transfer: [] },
      );
    };

    expect(typeof checks).toBe('function');
  });

  it('rejects procedures that take more than one argument', () => {
    const { port1 } = new MessageChannel();
    type TwoArg = {
      requests: { sum(first: number, second: number): number };
      events: Record<string, never>;
    };

    // @ts-expect-error - procedures take at most one argument
    RPC.from<TwoArg, ClientApi>(fromMessagePort(port1), {
      requests: { sum: (first, second) => first + second },
      events: {},
    });

    expect(true).toBe(true);
  });
});
