import { createTestController } from '@lib/effects/testing';
import { saveContact } from '../../platform/database';
import { loadIdentity, sendMessage, startP2p } from '../../platform/iroh';
import { encodeBeamCode } from '../../platform/qr-code';
import {
  $contacts,
  $onboarding,
  $onboardingRestored,
  $peerHandles,
  $peerLinks,
} from '../../state';
import { $dialPeer } from '../dial';
import { PEER_ID, SELF_ID, fakeLink, fakeSession } from './fixtures';

vi.mock('../../platform/database');
vi.mock('../../platform/qr-code');
vi.mock('../../platform/iroh', () => ({
  loadIdentity: vi.fn(),
  sendMessage: vi.fn(),
  startP2p: vi.fn(),
}));

/** Bring up a session that joined, and return it with the controller. */
const setup = () => {
  const session = fakeSession();
  vi.mocked(startP2p).mockResolvedValue(session);
  vi.mocked(loadIdentity).mockResolvedValue({
    endpointId: SELF_ID,
    secretKey: new Uint8Array(32),
  });

  return session;
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(sendMessage).mockResolvedValue(true);
  vi.mocked(encodeBeamCode).mockResolvedValue(null);
});

describe('$dialPeer', () => {
  it('records the peer, then dials and links it', async () => {
    const session = setup();
    const link = fakeLink();
    session.dial.mockResolvedValue(link);
    await using effects = createTestController();
    const dialPeer = await effects.run($dialPeer);
    const book = await effects.run($contacts);
    const links = await effects.run($peerLinks);
    const handles = await effects.run($peerHandles);

    await dialPeer(PEER_ID);

    expect(book.entries[PEER_ID]).toBeDefined();
    expect(saveContact).toHaveBeenCalled();
    expect(session.dial).toHaveBeenCalledWith(PEER_ID);
    expect(links.statuses[PEER_ID]).toBe('linked');
    expect(handles().get(PEER_ID)).toBe(link);
  });

  it('finishes pairing on the way', async () => {
    const session = setup();
    session.dial.mockResolvedValue(fakeLink());
    await using effects = createTestController();
    const onboardingRestored = await effects.run($onboardingRestored);
    const dialPeer = await effects.run($dialPeer);
    const progress = await effects.run($onboarding);
    onboardingRestored({ step: 'pairing', updatedAt: 1 });

    await dialPeer(PEER_ID);

    expect(progress.step).toBe('done');
  });

  it('marks a peer that doesn’t answer unreachable, keeping the contact', async () => {
    const session = setup();
    session.dial.mockRejectedValue(new Error('asleep'));
    await using effects = createTestController();
    const dialPeer = await effects.run($dialPeer);
    const book = await effects.run($contacts);
    const links = await effects.run($peerLinks);

    await dialPeer(PEER_ID);

    expect(links.statuses[PEER_ID]).toBe('unreachable');
    expect(book.entries[PEER_ID]).toBeDefined();
  });

  it('drops an id that isn’t an address', async () => {
    const session = setup();
    await using effects = createTestController();
    const dialPeer = await effects.run($dialPeer);
    const book = await effects.run($contacts);

    await dialPeer('bacon');

    expect(session.dial).not.toHaveBeenCalled();
    expect(book.entries).toEqual({});
  });

  it('won’t dial this device’s own link', async () => {
    const session = setup();
    await using effects = createTestController();
    const dialPeer = await effects.run($dialPeer);
    const book = await effects.run($contacts);

    await dialPeer(SELF_ID);

    expect(session.dial).not.toHaveBeenCalled();
    expect(book.entries).toEqual({});
  });

  it('leaves a peer already linked alone', async () => {
    const session = setup();
    session.dial.mockResolvedValue(fakeLink());
    await using effects = createTestController();
    const dialPeer = await effects.run($dialPeer);
    await dialPeer(PEER_ID);

    await dialPeer(PEER_ID);

    expect(session.dial).toHaveBeenCalledTimes(1);
  });

  it('throws without a session to dial over', async () => {
    vi.mocked(startP2p).mockRejectedValue(new Error('no wasm'));
    await using effects = createTestController();
    const dialPeer = await effects.run($dialPeer);

    await expect(dialPeer(PEER_ID)).rejects.toThrow(
      'Cannot dial a peer before the relay connection is up.',
    );
  });
});
