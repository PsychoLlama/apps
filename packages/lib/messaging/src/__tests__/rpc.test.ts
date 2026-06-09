import { RPC, RpcError, RpcClosedError, type RpcMessage } from '@lib/messaging';
import {
  MessagePortTransport,
  type SendOptions,
  type Transport,
} from '@lib/messaging/transport';

type ServerApi = {
  requests: {
    add(params: { left: number; right: number }): number;
    divide(params: { left: number; right: number }): Promise<number>;
    boom(params: { message: string }): number;
    denied(params: { resource: string }): number;
    echoSize(params: { buffer: ArrayBuffer }): number;
    mint(): ArrayBuffer;
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

/**
 * Wire two RPC peers over a real `MessageChannel` via the adapter under
 * test — no hand-rolled mock transport.
 */
const setup = () => {
  const { port1, port2 } = new MessageChannel();
  const logged: string[] = [];
  const sizes: number[] = [];

  const server = new RPC<ServerApi, ClientApi, SendOptions>(
    new MessagePortTransport(port1),
    {
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
        mint: (_params, options) => {
          const buffer = new ArrayBuffer(8);
          options.transfer = [buffer];
          return buffer;
        },
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
    },
  );

  const client = new RPC<ClientApi, ServerApi, SendOptions>(
    new MessagePortTransport(port2),
    {
      requests: {},
      events: {},
    },
  );

  // The adapter listens via addEventListener; ports deliver only once
  // started, and starting is the consumer's responsibility.
  port1.start();
  port2.start();

  // Events are fire-and-forget — nothing to await. A round-trip request is
  // an ordered barrier: it can't resolve until every message queued before
  // it on the same channel has been handled.
  const flush = () => client.request('add', { left: 0, right: 0 });

  return { server, client, logged, sizes, flush };
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
    const { client, logged, flush } = setup();
    const loose = client as unknown as {
      notify(method: string, params?: unknown): void;
    };

    loose.notify('constructor', {});
    loose.notify('__proto__', {});
    loose.notify('hasOwnProperty', {});
    await flush();

    expect(logged).toEqual([]);
  });

  it('delivers an event with a payload', async () => {
    const { client, logged, flush } = setup();

    client.notify('log', { message: 'hello' });
    await flush();

    expect(logged).toEqual(['hello']);
  });

  it('delivers a zero-argument event', async () => {
    const { client, logged, flush } = setup();

    client.notify('ping');
    await flush();

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
    const { client, sizes, flush } = setup();
    const buffer = new ArrayBuffer(8);

    client.notify('sink', { buffer }, { transfer: [buffer] });
    await flush();

    expect(sizes).toEqual([8]);
    expect(buffer.byteLength).toBe(0);
  });

  it('carries send options from a request handler back to the caller', async () => {
    const { client } = setup();

    // `mint` sets `options.transfer = [buffer]` on its reply bag. Arriving
    // with its 8 bytes intact proves the handler's options reached `send`.
    // (Asserting `byteLength` rather than `instanceof ArrayBuffer`: the port
    // deserializes the buffer in another realm, so `instanceof` is unreliable
    // here — the request-side transfer tests check `byteLength` for the same
    // reason.)
    const buffer = await client.request('mint');

    expect(buffer.byteLength).toBe(8);
  });

  it('rejects in-flight requests with an RpcClosedError on close', async () => {
    const { client } = setup();
    // The response round-trips asynchronously over the port; closing
    // synchronously after the call wins the race, so the request settles as
    // a close rather than a result.
    const pending = client.request('add', { left: 1, right: 1 });

    client.close();

    await expect(pending).rejects.toBeInstanceOf(RpcClosedError);
  });

  it('throws on request after close', () => {
    const { client } = setup();
    client.close();

    expect(() => client.request('add', { left: 1, right: 1 })).toThrow(
      RpcClosedError,
    );
  });

  it('throws on notify after close', () => {
    const { client } = setup();
    client.close();

    expect(() => client.notify('log', { message: 'hi' })).toThrow(
      RpcClosedError,
    );
  });

  it('discards the transport listener on close', () => {
    // Detaching the listener is the transport's job (it returns the
    // unsubscribe); close's contract is simply to invoke it. Whether
    // detaching actually halts delivery is covered in message-port.test.ts.
    let unsubscribed = false;
    const transport: Transport<RpcMessage, RpcMessage> = {
      send: () => undefined,
      onMessage: () => () => {
        unsubscribed = true;
      },
    };
    const rpc = new RPC<ClientApi, ServerApi>(transport, {
      requests: {},
      events: {},
    });

    rpc.close();

    expect(unsubscribed).toBe(true);
  });

  it('is idempotent across repeated close calls', () => {
    const { client } = setup();
    client.close();
    expect(() => client.close()).not.toThrow();
  });
});
