import type { Channel, MessageHandler } from '@lib/messaging';

type Inbound = { type: 'pong' } | { type: 'tick'; count: number };
type Outbound = { type: 'ping' } | { type: 'reset' };

/**
 * Minimal in-memory channel. Stands in for a real adapter so we can
 * exercise the interface contract without a transport.
 */
const createTestChannel = () => {
  const handlers = new Set<MessageHandler<Inbound>>();
  const sent: Outbound[] = [];

  const channel: Channel<Inbound, Outbound> = {
    send: (message) => {
      sent.push(message);
    },
    onMessage: (handler) => {
      handlers.add(handler);
    },
  };

  return {
    channel,
    sent,
    /** Simulate a message arriving from the peer. */
    deliver: (message: Inbound) => {
      for (const handler of handlers) handler(message);
    },
  };
};

describe('Channel', () => {
  it('records outbound messages', () => {
    const { channel, sent } = createTestChannel();

    channel.send({ type: 'ping' });
    channel.send({ type: 'reset' });

    expect(sent).toEqual([{ type: 'ping' }, { type: 'reset' }]);
  });

  it('delivers inbound messages to every handler', () => {
    const { channel, deliver } = createTestChannel();
    const first: Inbound[] = [];
    const second: Inbound[] = [];

    channel.onMessage((message) => first.push(message));
    channel.onMessage((message) => second.push(message));
    deliver({ type: 'pong' });

    expect(first).toEqual([{ type: 'pong' }]);
    expect(second).toEqual([{ type: 'pong' }]);
  });

  it('narrows inbound messages on the discriminant', () => {
    const { channel, deliver } = createTestChannel();
    let counted: number | undefined;

    channel.onMessage((message) => {
      // `count` is only reachable after narrowing on `type`.
      if (message.type === 'tick') counted = message.count;
    });
    deliver({ type: 'tick', count: 7 });

    expect(counted).toBe(7);
  });
});
