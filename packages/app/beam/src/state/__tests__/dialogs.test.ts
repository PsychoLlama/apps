/**
 * Unit tests for the modals' own commands. Errands closing them are covered
 * beside the commands that finish them, in `contacts` and `identity`.
 */

import { createTestController } from '@lib/effects/testing';
import {
  $invite,
  $inviteClosed,
  $inviteOpened,
  $removal,
  $removalClosed,
  $removalOpened,
  $rename,
  $renameClosed,
  $renameOpened,
} from '../dialogs';

describe('$invite', () => {
  it('starts out of the way', async () => {
    await using effects = createTestController();
    const invite = await effects.run($invite);

    expect(invite.open).toBe(false);
  });

  it('opens on request and closes on dismissal', async () => {
    await using effects = createTestController();
    const invite = await effects.run($invite);
    const inviteOpened = await effects.run($inviteOpened);
    const inviteClosed = await effects.run($inviteClosed);

    inviteOpened();
    expect(invite.open).toBe(true);

    inviteClosed();
    expect(invite.open).toBe(false);
  });
});

describe('$rename', () => {
  it('starts shut', async () => {
    await using effects = createTestController();
    const rename = await effects.run($rename);

    expect(rename.target).toBeNull();
  });

  it('opens over the record it was asked for', async () => {
    await using effects = createTestController();
    const rename = await effects.run($rename);
    const renameOpened = await effects.run($renameOpened);

    renameOpened({ kind: 'peer', endpointId: 'ep-1' });
    expect(rename.target).toEqual({ kind: 'peer', endpointId: 'ep-1' });

    renameOpened({ kind: 'self' });
    expect(rename.target).toEqual({ kind: 'self' });
  });

  it('closes on dismissal', async () => {
    await using effects = createTestController();
    const rename = await effects.run($rename);
    const renameOpened = await effects.run($renameOpened);
    const renameClosed = await effects.run($renameClosed);

    renameOpened({ kind: 'self' });
    renameClosed();

    expect(rename.target).toBeNull();
  });
});

describe('$removal', () => {
  it('starts shut', async () => {
    await using effects = createTestController();
    const removal = await effects.run($removal);

    expect(removal.endpointId).toBeNull();
  });

  it('re-aims at the contact most recently asked about', async () => {
    await using effects = createTestController();
    const removal = await effects.run($removal);
    const removalOpened = await effects.run($removalOpened);

    removalOpened('ep-1');
    removalOpened('ep-2');

    expect(removal.endpointId).toBe('ep-2');
  });

  it('closes on an answer', async () => {
    await using effects = createTestController();
    const removal = await effects.run($removal);
    const removalOpened = await effects.run($removalOpened);
    const removalClosed = await effects.run($removalClosed);

    removalOpened('ep-1');
    removalClosed();

    expect(removal.endpointId).toBeNull();
  });
});
