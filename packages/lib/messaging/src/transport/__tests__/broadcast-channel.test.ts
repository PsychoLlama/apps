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
  const publisher = new BroadcastChannelTransport<never, Wire>({
    channel: name,
  });
  const subscriber = new BroadcastChannelTransport<Wire, never>({
    channel: name,
  });
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
    const barrier = new BroadcastChannelTransport<Wire, never>({
      channel: name,
    });
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

  it('withholds a send from its own handlers by default', async () => {
    const name = `broadcast-channel-test-${channels++}`;
    const solo = new BroadcastChannelTransport<Wire, Wire>({ channel: name });
    const seen: Wire[] = [];
    solo.onMessage((message) => seen.push(message));

    // A sibling transport on the same name is the delivery barrier: once it
    // hears solo's post the routing is done, so an empty `seen` proves solo
    // never echoed the send to itself.
    const barrier = new BroadcastChannelTransport<Wire, never>({
      channel: name,
    });
    const routed = new Promise<void>((resolve) =>
      barrier.onMessage(() => resolve()),
    );

    solo.send({ type: 'created', file: 'self.ndjson' });
    await routed;

    expect(seen).toEqual([]);
    solo.close();
    barrier.close();
  });

  it('echoes a send back to its own handlers when localEmit is set', () => {
    const solo = new BroadcastChannelTransport<Wire, Wire>({
      channel: `broadcast-channel-test-${channels++}`,
      localEmit: true,
    });
    const seen: Wire[] = [];
    solo.onMessage((message) => seen.push(message));

    solo.send({ type: 'created', file: 'self.ndjson' });

    // Self-emit fires synchronously — no need to await a round trip.
    expect(seen).toEqual([{ type: 'created', file: 'self.ndjson' }]);
    solo.close();
  });

  it('stops self-emitting to a handler after it unsubscribes', () => {
    const solo = new BroadcastChannelTransport<Wire, Wire>({
      channel: `broadcast-channel-test-${channels++}`,
      localEmit: true,
    });
    const seen: Wire[] = [];
    const unsubscribe = solo.onMessage((message) => seen.push(message));

    unsubscribe();
    solo.send({ type: 'created', file: 'self.ndjson' });

    expect(seen).toEqual([]);
    solo.close();
  });
});
