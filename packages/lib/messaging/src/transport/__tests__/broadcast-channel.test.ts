import { BroadcastChannelTransport } from '@lib/messaging/broadcast-channel';

type Wire = { type: 'created'; file: string };

/**
 * Wire a publisher/subscriber pair on the same channel name. Each constructs
 * its own transport, since a channel never delivers to the instance that
 * posted — one shared transport would never hear itself.
 */
const setup = () => {
  // A unique name per call so concurrent tests don't cross-talk on one channel.
  const name = `broadcast-channel-test-${channels++}`;
  const publisher = new BroadcastChannelTransport<never, Wire>(name);
  const subscriber = new BroadcastChannelTransport<Wire, never>(name);
  const close = () => {
    publisher.close();
    subscriber.close();
  };
  return { name, publisher, subscriber, close };
};

let channels = 0;

describe('BroadcastChannelTransport', () => {
  it('delivers a posted message to a subscriber on the same channel', async () => {
    const { publisher, subscriber, close } = setup();
    const received = new Promise<Wire>((resolve) =>
      subscriber.onMessage(resolve),
    );

    publisher.send({ type: 'created', file: 'a.ndjson' });

    expect(await received).toEqual({ type: 'created', file: 'a.ndjson' });
    close();
  });

  it('delivers to every registered handler', async () => {
    const { publisher, subscriber, close } = setup();
    const first = new Promise<Wire>((resolve) => subscriber.onMessage(resolve));
    const second = new Promise<Wire>((resolve) =>
      subscriber.onMessage(resolve),
    );

    publisher.send({ type: 'created', file: 'b.ndjson' });

    expect(await Promise.all([first, second])).toEqual([
      { type: 'created', file: 'b.ndjson' },
      { type: 'created', file: 'b.ndjson' },
    ]);
    close();
  });

  it('stops delivering to its handlers once closed', async () => {
    const { name, publisher, subscriber, close } = setup();
    const seen: Wire[] = [];
    subscriber.onMessage((message) => seen.push(message));

    // A separate transport on the same name, opened before the post, is the
    // delivery barrier: once it hears the message the routing is done, so an
    // empty `seen` proves close() detached the subscriber's handler.
    const barrier = new BroadcastChannelTransport<Wire, never>(name);
    const routed = new Promise<void>((resolve) =>
      barrier.onMessage(() => resolve()),
    );

    subscriber.close();
    publisher.send({ type: 'created', file: 'd.ndjson' });
    await routed;
    barrier.close();

    expect(seen).toEqual([]);
    close();
  });

  it('stops delivering to a handler after it unsubscribes', async () => {
    const { publisher, subscriber, close } = setup();
    const seen: Wire[] = [];
    const unsubscribe = subscriber.onMessage((message) => {
      seen.push(message);
    });

    // A persistent handler doubles as a delivery barrier: once it observes a
    // message, anything posted before it has already been routed.
    const settled = () =>
      new Promise<void>((resolve) => subscriber.onMessage(() => resolve()));

    unsubscribe();
    publisher.send({ type: 'created', file: 'c.ndjson' });
    await settled();

    expect(seen).toEqual([]);
    close();
  });
});
