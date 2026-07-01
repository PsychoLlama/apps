import { BroadcastChannelTransport } from '@lib/messaging/broadcast-channel';

type Wire = { type: 'created'; file: string };

// A unique name per transport pair so concurrent tests don't cross-talk on one
// channel. Transports bind with `using`, so each closes when its test's scope
// exits — no manual teardown to forget, even if an assertion throws first.
let channels = 0;
const uniqueChannel = () => `broadcast-channel-test-${channels++}`;

describe('BroadcastChannelTransport', () => {
  it('delivers a posted message to a subscriber on the same channel', async () => {
    const channel = uniqueChannel();
    // A publisher and subscriber each hold their own transport, since a channel
    // never delivers to the instance that posted — one shared transport would
    // never hear itself.
    using publisher = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    using subscriber = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    const received = new Promise<Wire>((resolve) =>
      subscriber.onMessage(resolve),
    );

    publisher.send({ type: 'created', file: 'a.ndjson' });

    expect(await received).toEqual({ type: 'created', file: 'a.ndjson' });
  });

  it('delivers to every registered handler', async () => {
    const channel = uniqueChannel();
    using publisher = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    using subscriber = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    const first = new Promise<Wire>((resolve) => subscriber.onMessage(resolve));
    const second = new Promise<Wire>((resolve) =>
      subscriber.onMessage(resolve),
    );

    publisher.send({ type: 'created', file: 'b.ndjson' });

    expect(await Promise.all([first, second])).toEqual([
      { type: 'created', file: 'b.ndjson' },
      { type: 'created', file: 'b.ndjson' },
    ]);
  });

  it('stops delivering to its handlers once closed', async () => {
    const channel = uniqueChannel();
    using publisher = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    using subscriber = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    const seen: Wire[] = [];
    subscriber.onMessage((message) => seen.push(message));

    // A separate transport on the same name, opened before the post, is the
    // delivery barrier: once it hears the message the routing is done, so an
    // empty `seen` proves close() detached the subscriber's handler.
    using barrier = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    const routed = new Promise<void>((resolve) =>
      barrier.onMessage(() => resolve()),
    );

    subscriber.close();
    publisher.send({ type: 'created', file: 'd.ndjson' });
    await routed;

    expect(seen).toEqual([]);
  });

  it('stops delivering to a handler after it unsubscribes', async () => {
    const channel = uniqueChannel();
    using publisher = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    using subscriber = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
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
  });

  it('withholds a send from its own handlers by default', async () => {
    const channel = uniqueChannel();
    using solo = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    const seen: Wire[] = [];
    solo.onMessage((message) => seen.push(message));

    // A sibling transport on the same name is the delivery barrier: once it
    // hears solo's post the routing is done, so an empty `seen` proves solo
    // never echoed the send to itself.
    using barrier = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    const routed = new Promise<void>((resolve) =>
      barrier.onMessage(() => resolve()),
    );

    solo.send({ type: 'created', file: 'self.ndjson' });
    await routed;

    expect(seen).toEqual([]);
  });

  it('echoes a send back to its own handlers when selfDeliver is set', () => {
    using solo = new BroadcastChannelTransport<Wire>({
      channel: uniqueChannel(),
      selfDeliver: true,
    });
    const seen: Wire[] = [];
    solo.onMessage((message) => seen.push(message));

    solo.send({ type: 'created', file: 'self.ndjson' });

    // Self-delivery fires synchronously — no need to await a round trip.
    expect(seen).toEqual([{ type: 'created', file: 'self.ndjson' }]);
  });

  it('stops self-delivering to a handler after it unsubscribes', () => {
    using solo = new BroadcastChannelTransport<Wire>({
      channel: uniqueChannel(),
      selfDeliver: true,
    });
    const seen: Wire[] = [];
    const unsubscribe = solo.onMessage((message) => seen.push(message));

    unsubscribe();
    solo.send({ type: 'created', file: 'self.ndjson' });

    expect(seen).toEqual([]);
  });
});
