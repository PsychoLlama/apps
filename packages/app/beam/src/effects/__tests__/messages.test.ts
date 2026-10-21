import { createTestController } from '@lib/effects/testing';
import { saveContact } from '../../platform/database';
import { sendMessage } from '../../platform/iroh';
import { helloMessage, shareMessage } from '../../protocol';
import {
  $contacts,
  $contactsRestored,
  $identityResolved,
  $peerLinked,
  $shareLog,
} from '../../state';
import { $applyPeerMessage, $renameDevice } from '../messages';
import { PEER_ID, SELF_ID, fakeContact, fakeLink } from './fixtures';

vi.mock('../../platform/database');
vi.mock('../../platform/iroh', () => ({ sendMessage: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(sendMessage).mockResolvedValue(true);
});

describe('$applyPeerMessage', () => {
  it('takes a greeting as the peer’s advertised name', async () => {
    await using effects = createTestController();
    const contactsRestored = await effects.run($contactsRestored);
    const applyPeerMessage = await effects.run($applyPeerMessage);
    const book = await effects.run($contacts);
    contactsRestored([fakeContact({ label: 'Mine' })]);

    await applyPeerMessage(PEER_ID, helloMessage('Theirs'));

    expect(book.entries[PEER_ID]).toMatchObject({
      label: 'Mine',
      suggestedLabel: 'Theirs',
    });
    expect(saveContact).toHaveBeenCalled();
  });

  it('logs a share against the sender', async () => {
    await using effects = createTestController();
    const applyPeerMessage = await effects.run($applyPeerMessage);
    const log = await effects.run($shareLog);

    await applyPeerMessage(PEER_ID, shareMessage('hello'));

    expect(log.items).toMatchObject([
      { endpointId: PEER_ID, body: 'hello', status: 'received' },
    ]);
  });
});

describe('$renameDevice', () => {
  it('renames, then re-greets every linked peer', async () => {
    await using effects = createTestController();
    const identityResolved = await effects.run($identityResolved);
    const peerLinked = await effects.run($peerLinked);
    const renameDevice = await effects.run($renameDevice);
    const link = fakeLink();
    identityResolved(SELF_ID);
    peerLinked(link);

    await renameDevice('Laptop');

    expect(saveContact).toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith(link, helloMessage('Laptop'));
  });

  it('announces the fallback when the name is cleared', async () => {
    await using effects = createTestController();
    const identityResolved = await effects.run($identityResolved);
    const peerLinked = await effects.run($peerLinked);
    const renameDevice = await effects.run($renameDevice);
    const link = fakeLink();
    identityResolved(SELF_ID);
    peerLinked(link);

    await renameDevice(null);

    expect(sendMessage).toHaveBeenCalledWith(
      link,
      helloMessage(SELF_ID.slice(0, 8)),
    );
  });

  it('tells nobody when the rename didn’t take', async () => {
    await using effects = createTestController();
    const peerLinked = await effects.run($peerLinked);
    const renameDevice = await effects.run($renameDevice);
    peerLinked(fakeLink());

    await renameDevice('Laptop');

    expect(sendMessage).not.toHaveBeenCalled();
  });
});
