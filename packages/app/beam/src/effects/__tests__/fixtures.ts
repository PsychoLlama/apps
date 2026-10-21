import type { Mock } from 'vitest';
import type { Contact } from '../../platform/database';
import { createInbox } from '../../platform/inbox';
import type { P2pSession, PeerLink } from '../../platform/iroh';

/**
 * Stand-in endpoint ids. Well-formed — 32 bytes of lowercase hex — because
 * `$dialPeer` checks the format before it records anything, and a readable
 * placeholder would be turned away as a malformed link.
 */
export const SELF_ID = `e1${'0'.repeat(62)}`;

export const PEER_ID = `e2${'0'.repeat(62)}`;

/** A peer link with a hand-settled `closed`. */
export interface FakeLink extends PeerLink {
  /** Settle `closed`, as the far side hanging up would. */
  hangUp: () => void;

  /** Spied, so tests can see the link was let go. */
  release: Mock<() => void>;
}

/** A stand-in peer link, already listening, as a real one arrives. */
export const fakeLink = (endpointId = PEER_ID): FakeLink => {
  let hangUp!: () => void;
  const closed = new Promise<void>((resolve) => {
    hangUp = resolve;
  });

  return {
    endpointId,
    messages: createInbox(),
    closed,
    hangUp,
    send: vi.fn(() => Promise.resolve()),
    release: vi.fn(),
  };
};

/** A stand-in worker session. Queues are real; the rest is spies. */
export const fakeSession = () =>
  ({
    peers: createInbox<PeerLink>(),
    relay: createInbox<string | null>(),
    loadIdentity: vi.fn(),
    join: vi.fn(() => Promise.resolve()),
    dial: vi.fn<P2pSession['dial']>(),
    release: vi.fn(),
  }) satisfies P2pSession;

/** A contact as the address book would hold it. */
export const fakeContact = (overrides: Partial<Contact> = {}): Contact => ({
  kind: 'peer',
  endpointId: PEER_ID,
  label: null,
  suggestedLabel: null,
  createdAt: 1,
  lastSeenAt: 1,
  ...overrides,
});

/** Let queued promise callbacks run. */
export const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
