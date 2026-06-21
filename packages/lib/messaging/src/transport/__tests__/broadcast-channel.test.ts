import { BroadcastChannelTransport } from '@lib/messaging/broadcast-channel';

type Wire = { type: 'created'; file: string };

/**
 * Wire a publisher/subscriber pair over a real `BroadcastChannel`. They hold
 * separate channels on the same name, since a channel never delivers to the
 * instance that posted — the publisher's own channel would never hear it.
 */
const setup = () => {
  // A unique name per call so concurrent tests don't cross-talk on one channel.
  const name = `broadcast-channel-test-${channels++}`;
  const publisherChannel = new BroadcastChannel(name);
  const subscriberChannel = new BroadcastChannel(name);
  const publisher = new BroadcastChannelTransport<never, Wire>(
    publisherChannel,
  );
  const subscriber = new BroadcastChannelTransport<Wire, never>(
    subscriberChannel,
  );
  const close = () => {
    publisherChannel.close();
    subscriberChannel.close();
  };
  return { publisher, subscriber, close };
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
