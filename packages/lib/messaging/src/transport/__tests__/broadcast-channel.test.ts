import { BroadcastChannelTransport } from '@lib/messaging/broadcast-channel';

type Wire = { type: 'created'; file: string };

// A unique name per transport pair so concurrent tests don't cross-talk on one
// channel. Transports bind with `await using`, so each closes when its test's scope
// exits — no manual teardown to forget, even if an assertion throws first.
let channels = 0;
const uniqueChannel = () => `broadcast-channel-test-${channels++}`;

describe('BroadcastChannelTransport', () => {
  it('delivers a posted message to a subscriber on the same channel', async () => {
    const channel = uniqueChannel();
    // A publisher and subscriber each hold their own transport, since a channel
    // never delivers to the instance that posted — one shared transport would
    // never hear itself.
    await using publisher = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    await using subscriber = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    const received = new Promise<Wire>((resolve) =>
      subscriber.onMessage(resolve),
    );

    await publisher.send({ type: 'created', file: 'a.ndjson' });

    expect(await received).toEqual({ type: 'created', file: 'a.ndjson' });
  });

  it('delivers to every registered handler', async () => {
    const channel = uniqueChannel();
    await using publisher = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    await using subscriber = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    const first = new Promise<Wire>((resolve) => subscriber.onMessage(resolve));
    const second = new Promise<Wire>((resolve) =>
      subscriber.onMessage(resolve),
    );

    await publisher.send({ type: 'created', file: 'b.ndjson' });

    expect(await Promise.all([first, second])).toEqual([
      { type: 'created', file: 'b.ndjson' },
      { type: 'created', file: 'b.ndjson' },
    ]);
  });

  it('stops delivering to its handlers once closed', async () => {
    const channel = uniqueChannel();
    await using publisher = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    await using subscriber = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    const seen: Wire[] = [];
    subscriber.onMessage((message) => seen.push(message));

    // A separate transport on the same name, opened before the post, is the
    // delivery barrier: once it hears the message the routing is done, so an
    // empty `seen` proves close() detached the subscriber's handler.
    await using barrier = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    const routed = new Promise<void>((resolve) =>
      barrier.onMessage(() => resolve()),
    );

    subscriber.close();
    await publisher.send({ type: 'created', file: 'd.ndjson' });
    await routed;

    expect(seen).toEqual([]);
  });

  it('stops delivering to a handler after it unsubscribes', async () => {
    const channel = uniqueChannel();
    await using publisher = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    await using subscriber = new BroadcastChannelTransport<Wire>({
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
    await publisher.send({ type: 'created', file: 'c.ndjson' });
    await settled();

    expect(seen).toEqual([]);
  });

  it('withholds a send from its own handlers by default', async () => {
    const channel = uniqueChannel();
    await using solo = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    const seen: Wire[] = [];
    solo.onMessage((message) => seen.push(message));

    // A sibling transport on the same name is the delivery barrier: once it
    // hears solo's post the routing is done, so an empty `seen` proves solo
    // never echoed the send to itself.
    await using barrier = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    const routed = new Promise<void>((resolve) =>
      barrier.onMessage(() => resolve()),
    );

    await solo.send({ type: 'created', file: 'self.ndjson' });
    await routed;

    expect(seen).toEqual([]);
  });

  it('echoes a send back to its own handlers when selfDeliver is set', async () => {
    await using solo = new BroadcastChannelTransport<Wire>({
      channel: uniqueChannel(),
      selfDeliver: true,
    });
    const seen: Wire[] = [];
    solo.onMessage((message) => seen.push(message));

    await solo.send({ type: 'created', file: 'self.ndjson' });

    // Self-delivery runs inline, before the send settles — no round trip to
    // wait on, unlike the sibling path.
    expect(seen).toEqual([{ type: 'created', file: 'self.ndjson' }]);
  });

  it('stops self-delivering to a handler after it unsubscribes', async () => {
    await using solo = new BroadcastChannelTransport<Wire>({
      channel: uniqueChannel(),
      selfDeliver: true,
    });
    const seen: Wire[] = [];
    const unsubscribe = solo.onMessage((message) => seen.push(message));

    unsubscribe();
    await solo.send({ type: 'created', file: 'self.ndjson' });

    expect(seen).toEqual([]);
  });

  it('stops delivering to its handlers once disposed', async () => {
    const channel = uniqueChannel();
    await using publisher = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    const seen: Wire[] = [];

    // Disposal is scope-bound, so the subscriber gets its own block: leaving
    // it is what tears the transport down, and the assertions below run
    // against an already-disposed instance.
    {
      await using subscriber = new BroadcastChannelTransport<Wire>({
        channel,
        selfDeliver: false,
      });
      subscriber.onMessage((message) => seen.push(message));
    }

    // Same barrier trick as the `close()` case: a live sibling proves the post
    // was routed, so an empty `seen` means disposal detached the subscriber.
    await using barrier = new BroadcastChannelTransport<Wire>({
      channel,
      selfDeliver: false,
    });
    const routed = new Promise<void>((resolve) =>
      barrier.onMessage(() => resolve()),
    );

    await publisher.send({ type: 'created', file: 'e.ndjson' });
    await routed;

    expect(seen).toEqual([]);
  });
});
