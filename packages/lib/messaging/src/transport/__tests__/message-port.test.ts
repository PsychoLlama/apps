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

    sender.send({ type: 'data' });

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
    sender.send({ type: 'tick', count: 1 });
    await settled();

    expect(seen).toEqual([]);
  });

  it('narrows inbound messages on the discriminant', async () => {
    const { sender, receiver } = setup();
    const received = new Promise<Wire>((resolve) =>
      receiver.onMessage(resolve),
    );

    sender.send({ type: 'tick', count: 7 });

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
    sender.send({ type: 'data', buffer }, { transfer: [buffer] });

    const message = await received;
    const size =
      message.type === 'data' ? (message.buffer?.byteLength ?? -1) : -1;
    expect(size).toBe(8);
    expect(buffer.byteLength).toBe(0); // neutered in the sender
  });
});
