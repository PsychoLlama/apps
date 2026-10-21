import { createTestController } from '@lib/effects/testing';
import { saveContact, saveOnboarding } from '../../platform/database';
import { sendMessage } from '../../platform/iroh';
import { helloMessage, shareMessage } from '../../protocol';
import {
  $contacts,
  $contactsRestored,
  $identityResolved,
  $onboarding,
  $onboardingRestored,
  $peerHandles,
  $peerLinked,
  $peerLinks,
  $shareLog,
  $shareQueued,
} from '../../state';
import { $disconnectPeer, $greetPeer, $linkPeer } from '../link';
import { PEER_ID, SELF_ID, fakeContact, fakeLink, flush } from './fixtures';

vi.mock('../../platform/database');
vi.mock('../../platform/iroh', () => ({ sendMessage: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(sendMessage).mockResolvedValue(true);
});

/** A live session's signal, aborted once the test is done with it. */
const sessionSignal = () => {
  const controller = new AbortController();
  onTestFinished(() => controller.abort());
  return controller;
};

describe('$linkPeer', () => {
  it('holds the link and marks the peer linked', async () => {
    await using effects = createTestController();
    const linkPeer = await effects.run($linkPeer);
    const links = await effects.run($peerLinks);
    const handles = await effects.run($peerHandles);
    const link = fakeLink();

    await linkPeer(link, sessionSignal().signal);

    expect(links.statuses[PEER_ID]).toBe('linked');
    expect(handles().get(PEER_ID)).toBe(link);
  });

  it('introduces this device once its key has landed', async () => {
    await using effects = createTestController();
    const identityResolved = await effects.run($identityResolved);
    const linkPeer = await effects.run($linkPeer);
    const link = fakeLink();
    identityResolved(SELF_ID);

    await linkPeer(link, sessionSignal().signal);

    expect(sendMessage).toHaveBeenCalledWith(
      link,
      helloMessage(SELF_ID.slice(0, 8)),
    );
  });

  it('says nothing before the key lands', async () => {
    await using effects = createTestController();
    const linkPeer = await effects.run($linkPeer);

    await linkPeer(fakeLink(), sessionSignal().signal);

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('sends whatever was queued while the peer was away', async () => {
    await using effects = createTestController();
    const shareQueued = await effects.run($shareQueued);
    const linkPeer = await effects.run($linkPeer);
    const log = await effects.run($shareLog);
    const link = fakeLink();
    shareQueued({ id: 'a', endpointId: PEER_ID, body: 'waiting', at: 1 });

    await linkPeer(link, sessionSignal().signal);

    expect(sendMessage).toHaveBeenCalledWith(link, shareMessage('waiting'));
    expect(log.items).toMatchObject([{ status: 'sent' }]);
  });

  it('releases the link it replaces', async () => {
    await using effects = createTestController();
    const linkPeer = await effects.run($linkPeer);
    const handles = await effects.run($peerHandles);
    const first = fakeLink();
    const second = fakeLink();
    const { signal } = sessionSignal();
    await linkPeer(first, signal);

    await linkPeer(second, signal);

    expect(first.release).toHaveBeenCalled();
    expect(handles().get(PEER_ID)).toBe(second);
  });

  it('reads messages off the link as they arrive', async () => {
    await using effects = createTestController();
    const contactsRestored = await effects.run($contactsRestored);
    const linkPeer = await effects.run($linkPeer);
    const log = await effects.run($shareLog);
    const book = await effects.run($contacts);
    const link = fakeLink();
    contactsRestored([fakeContact()]);
    await linkPeer(link, sessionSignal().signal);

    link.messages.push(helloMessage('Theirs'));
    link.messages.push(shareMessage('hello'));
    await flush();

    expect(book.entries[PEER_ID].suggestedLabel).toBe('Theirs');
    expect(log.items).toMatchObject([{ body: 'hello', status: 'received' }]);
  });

  it('marks the peer closed when the link ends', async () => {
    await using effects = createTestController();
    const linkPeer = await effects.run($linkPeer);
    const links = await effects.run($peerLinks);
    const handles = await effects.run($peerHandles);
    const link = fakeLink();
    await linkPeer(link, sessionSignal().signal);

    link.hangUp();
    await flush();

    expect(links.statuses[PEER_ID]).toBe('closed');
    expect(handles().has(PEER_ID)).toBe(false);
  });

  it('ignores a close from a link already replaced', async () => {
    await using effects = createTestController();
    const linkPeer = await effects.run($linkPeer);
    const links = await effects.run($peerLinks);
    const handles = await effects.run($peerHandles);
    const first = fakeLink();
    const second = fakeLink();
    const { signal } = sessionSignal();
    await linkPeer(first, signal);
    await linkPeer(second, signal);

    first.hangUp();
    await flush();

    expect(links.statuses[PEER_ID]).toBe('linked');
    expect(handles().get(PEER_ID)).toBe(second);
  });

  it('stops listening once the session ends', async () => {
    await using effects = createTestController();
    const contactsRestored = await effects.run($contactsRestored);
    const linkPeer = await effects.run($linkPeer);
    const links = await effects.run($peerLinks);
    const book = await effects.run($contacts);
    const link = fakeLink();
    const session = sessionSignal();
    contactsRestored([fakeContact()]);
    await linkPeer(link, session.signal);

    session.abort();
    link.messages.push(helloMessage('Theirs'));
    link.hangUp();
    await flush();

    expect(book.entries[PEER_ID].suggestedLabel).toBeNull();
    expect(links.statuses[PEER_ID]).toBe('linked');
  });
});

describe('$greetPeer', () => {
  it('files the peer, finishes pairing, and links it', async () => {
    await using effects = createTestController();
    const onboardingRestored = await effects.run($onboardingRestored);
    const greetPeer = await effects.run($greetPeer);
    const book = await effects.run($contacts);
    const progress = await effects.run($onboarding);
    const links = await effects.run($peerLinks);
    onboardingRestored({ step: 'pairing', updatedAt: 1 });

    await greetPeer(fakeLink(), sessionSignal().signal);

    expect(book.entries[PEER_ID]).toBeDefined();
    expect(saveContact).toHaveBeenCalled();
    expect(progress.step).toBe('done');
    expect(saveOnboarding).toHaveBeenCalled();
    expect(links.statuses[PEER_ID]).toBe('linked');
  });

  it('fails without linking when the contact can’t be written', async () => {
    const error = new Error('Testing failures');
    vi.mocked(saveContact).mockRejectedValue(error);
    await using effects = createTestController();
    const greetPeer = await effects.run($greetPeer);
    const links = await effects.run($peerLinks);

    await expect(greetPeer(fakeLink(), sessionSignal().signal)).rejects.toBe(
      error,
    );
    expect(links.statuses).toEqual({});
  });
});

describe('$disconnectPeer', () => {
  it('hangs up and drops the bookkeeping', async () => {
    await using effects = createTestController();
    const peerLinked = await effects.run($peerLinked);
    const disconnectPeer = await effects.run($disconnectPeer);
    const links = await effects.run($peerLinks);
    const handles = await effects.run($peerHandles);
    const link = fakeLink();
    peerLinked(link);

    disconnectPeer(PEER_ID);

    expect(link.release).toHaveBeenCalled();
    expect(links.statuses).toEqual({});
    expect(handles().size).toBe(0);
  });

  it('is a no-op without a live link', async () => {
    await using effects = createTestController();
    const disconnectPeer = await effects.run($disconnectPeer);
    const links = await effects.run($peerLinks);

    disconnectPeer(PEER_ID);

    expect(links.statuses).toEqual({});
  });
});
