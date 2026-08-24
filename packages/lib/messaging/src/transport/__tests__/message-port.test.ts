import { MessagePortTransport } from '@lib/messaging/message-port';

type Wire =
  { type: 'data'; buffer?: ArrayBuffer } | { type: 'tick'; count: number };

/**
 * Wire a sender/receiver pair over a real `MessageChannel`. Ports are
 * started eagerly — the transport never starts them (that's the consumer's
 * call), so the tests stand in as the consumer.
 */
const setup = () => {
  const { port1, port2 } = new MessageChannel();
  const sender = new MessagePortTransport<Wire, Wire>(port1);
  const receiver = new MessagePortTransport<Wire, Wire>(port2);
  port1.start();
  port2.start();
  return { sender, receiver };
};

describe('MessagePortTransport', () => {
  it('delivers messages to every registered handler', async () => {
    const { sender, receiver } = setup();
    const first = new Promise<Wire>((resolve) => receiver.onMessage(resolve));
    const second = new Promise<Wire>((resolve) => receiver.onMessage(resolve));

    await sender.send({ type: 'data' });

    expect(await Promise.all([first, second])).toEqual([
      { type: 'data' },
      { type: 'data' },
    ]);
  });

  it('stops delivering to a handler after it unsubscribes', async () => {
    const { sender, receiver } = setup();
    const seen: Wire[] = [];
    const unsubscribe = receiver.onMessage((message) => {
      seen.push(message);
    });

    // A second, persistent handler doubles as a delivery barrier: once it
    // observes a message, anything posted before it has already been routed.
    const settled = () =>
      new Promise<void>((resolve) => receiver.onMessage(() => resolve()));

    unsubscribe();
    await sender.send({ type: 'tick', count: 1 });
    await settled();

    expect(seen).toEqual([]);
  });

  it('narrows inbound messages on the discriminant', async () => {
    const { sender, receiver } = setup();
    const received = new Promise<Wire>((resolve) =>
      receiver.onMessage(resolve),
    );

    await sender.send({ type: 'tick', count: 7 });

    const message = await received;
    let counted: number | undefined;
    // `count` is only reachable after narrowing on `type`.
    if (message.type === 'tick') counted = message.count;
    expect(counted).toBe(7);
  });

  it('transfers objects by reference', async () => {
    const { sender, receiver } = setup();
    const received = new Promise<Wire>((resolve) =>
      receiver.onMessage(resolve),
    );

    const buffer = new ArrayBuffer(8);
    await sender.send({ type: 'data', buffer }, { transfer: [buffer] });

    const message = await received;
    const size =
      message.type === 'data' ? (message.buffer?.byteLength ?? -1) : -1;
    expect(size).toBe(8);
    expect(buffer.byteLength).toBe(0); // neutered in the sender
  });

  it('rejects a send the endpoint refuses', async () => {
    const { sender } = setup();
    // A function can't be structured-cloned, so `postMessage` throws a
    // `DataCloneError` synchronously. It must reach the caller as a rejection
    // like any other send failure, not as a synchronous throw.
    const unclonable = { type: 'data', buffer: () => {} } as unknown as Wire;

    await expect(sender.send(unclonable)).rejects.toThrow();
  });

  it('stays usable after a failed send', async () => {
    const { sender, receiver } = setup();
    const received = new Promise<Wire>((resolve) =>
      receiver.onMessage(resolve),
    );
    const unclonable = { type: 'data', buffer: () => {} } as unknown as Wire;

    // A rejection describes the one message, never the channel: a payload the
    // carrier couldn't serialize says nothing about the next one.
    await expect(sender.send(unclonable)).rejects.toThrow();
    await sender.send({ type: 'tick', count: 3 });

    expect(await received).toEqual({ type: 'tick', count: 3 });
  });

  it('detaches every handler on dispose', async () => {
    const { port1, port2 } = new MessageChannel();
    const sender = new MessagePortTransport<Wire, Wire>(port1);
    port1.start();
    port2.start();

    const seen: Wire[] = [];
    {
      await using receiver = new MessagePortTransport<Wire, Wire>(port2);
      // Two handlers, so this covers unwinding the set rather than just the
      // most recent registration.
      receiver.onMessage((message) => seen.push(message));
      receiver.onMessage((message) => seen.push(message));
    }

    // The port itself is untouched by disposal, so a fresh transport over it
    // still hears traffic — and doubles as the delivery barrier.
    const barrier = new MessagePortTransport<Wire, Wire>(port2);
    const routed = new Promise<void>((resolve) =>
      barrier.onMessage(() => resolve()),
    );

    await sender.send({ type: 'tick', count: 1 });
    await routed;

    expect(seen).toEqual([]);
  });
});
