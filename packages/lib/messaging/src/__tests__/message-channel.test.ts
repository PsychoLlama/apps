import type { Channel } from '@lib/messaging';
import { fromMessagePort, isTransferable } from '@lib/messaging/channel';

type Wire =
  | { type: 'data'; buffer?: ArrayBuffer }
  | { type: 'tick'; count: number };

/**
 * Wire a sender/receiver pair over a real `MessageChannel`. Ports are
 * started eagerly — the adapter never starts them (that's the consumer's
 * call), so the tests stand in as the consumer.
 */
const setup = () => {
  const { port1, port2 } = new MessageChannel();
  const sender = fromMessagePort<Wire, Wire>(port1);
  const receiver = fromMessagePort<Wire, Wire>(port2);
  port1.start();
  port2.start();
  return { sender, receiver };
};

describe('fromMessagePort', () => {
  it('brands the channel as transferable', () => {
    expect(isTransferable(setup().sender)).toBe(true);
  });

  it('reports a plain channel as non-transferable', () => {
    const plain: Channel<Wire, Wire> = {
      send: () => undefined,
      onMessage: () => undefined,
    };

    expect(isTransferable(plain)).toBe(false);
  });

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
