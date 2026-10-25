/**
 * Unit tests for the modals' own commands. Errands closing them are covered
 * beside the commands that finish them, in `contacts` and `identity`.
 */

import { createTestController } from '@lib/effects/testing';
import {
  $inviteOpen,
  $inviteClosed,
  $inviteOpened,
  $removalTarget,
  $removalClosed,
  $removalOpened,
  $renameTarget,
  $renameClosed,
  $renameOpened,
} from '../dialogs';

describe('$inviteOpen', () => {
  it('starts out of the way', async () => {
    await using effects = createTestController();
    const inviteOpen = await effects.run($inviteOpen);

    expect(inviteOpen()).toBe(false);
  });

  it('opens on request and closes on dismissal', async () => {
    await using effects = createTestController();
    const inviteOpen = await effects.run($inviteOpen);
    const inviteOpened = await effects.run($inviteOpened);
    const inviteClosed = await effects.run($inviteClosed);

    inviteOpened();
    expect(inviteOpen()).toBe(true);

    inviteClosed();
    expect(inviteOpen()).toBe(false);
  });
});

describe('$renameTarget', () => {
  it('starts shut', async () => {
    await using effects = createTestController();
    const renameTarget = await effects.run($renameTarget);

    expect(renameTarget()).toBeNull();
  });

  it('opens over the record it was asked for', async () => {
    await using effects = createTestController();
    const renameTarget = await effects.run($renameTarget);
    const renameOpened = await effects.run($renameOpened);

    renameOpened({ kind: 'peer', endpointId: 'ep-1' });
    expect(renameTarget()).toEqual({ kind: 'peer', endpointId: 'ep-1' });

    renameOpened({ kind: 'self' });
    expect(renameTarget()).toEqual({ kind: 'self' });
  });

  it('closes on dismissal', async () => {
    await using effects = createTestController();
    const renameTarget = await effects.run($renameTarget);
    const renameOpened = await effects.run($renameOpened);
    const renameClosed = await effects.run($renameClosed);

    renameOpened({ kind: 'self' });
    renameClosed();

    expect(renameTarget()).toBeNull();
  });
});

describe('$removalTarget', () => {
  it('starts shut', async () => {
    await using effects = createTestController();
    const removalTarget = await effects.run($removalTarget);

    expect(removalTarget()).toBeNull();
  });

  it('re-aims at the contact most recently asked about', async () => {
    await using effects = createTestController();
    const removalTarget = await effects.run($removalTarget);
    const removalOpened = await effects.run($removalOpened);

    removalOpened('ep-1');
    removalOpened('ep-2');

    expect(removalTarget()).toBe('ep-2');
  });

  it('closes on an answer', async () => {
    await using effects = createTestController();
    const removalTarget = await effects.run($removalTarget);
    const removalOpened = await effects.run($removalOpened);
    const removalClosed = await effects.run($removalClosed);

    removalOpened('ep-1');
    removalClosed();

    expect(removalTarget()).toBeNull();
  });
});
