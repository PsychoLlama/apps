import type { Channel } from '@lib/messaging';
import { fromMessagePort, isTransferable } from '@lib/messaging/channel';

type Wire =
  | { type: 'data'; buffer?: ArrayBuffer }
  | { type: 'tick'; count: number };

// MessagePort delivers asynchronously; let queued messages drain.
const tick = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

describe('fromMessagePort', () => {
  it('brands the channel as transferable', () => {
    const { port1 } = new MessageChannel();

    expect(isTransferable(fromMessagePort<Wire, Wire>(port1))).toBe(true);
  });

  it('reports a plain channel as non-transferable', () => {
    const plain: Channel<Wire, Wire> = {
      send: () => undefined,
      onMessage: () => undefined,
    };

    expect(isTransferable(plain)).toBe(false);
  });

  it('delivers messages to every registered handler', async () => {
    const { port1, port2 } = new MessageChannel();
    const sender = fromMessagePort<Wire, Wire>(port1);
    const receiver = fromMessagePort<Wire, Wire>(port2);
    const first: Wire[] = [];
    const second: Wire[] = [];
    receiver.onMessage((message) => first.push(message));
    receiver.onMessage((message) => second.push(message));

    sender.send({ type: 'data' });
    await tick();

    expect(first).toEqual([{ type: 'data' }]);
    expect(second).toEqual([{ type: 'data' }]);
  });

  it('narrows inbound messages on the discriminant', async () => {
    const { port1, port2 } = new MessageChannel();
    const sender = fromMessagePort<Wire, Wire>(port1);
    const receiver = fromMessagePort<Wire, Wire>(port2);
    let counted: number | undefined;
    receiver.onMessage((message) => {
      // `count` is only reachable after narrowing on `type`.
      if (message.type === 'tick') counted = message.count;
    });

    sender.send({ type: 'tick', count: 7 });
    await tick();

    expect(counted).toBe(7);
  });

  it('transfers objects by reference', async () => {
    const { port1, port2 } = new MessageChannel();
    const sender = fromMessagePort<Wire, Wire>(port1);
    const receiver = fromMessagePort<Wire, Wire>(port2);
    const sizes: number[] = [];
    receiver.onMessage((message) => {
      if (message.type === 'data') sizes.push(message.buffer?.byteLength ?? -1);
    });

    const buffer = new ArrayBuffer(8);
    sender.send({ type: 'data', buffer }, { transfer: [buffer] });
    await tick();

    expect(sizes).toEqual([8]);
    expect(buffer.byteLength).toBe(0); // neutered in the sender
  });
});
