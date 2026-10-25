import { createTestController } from '@lib/effects/testing';
import { removeContact, saveContact } from '../../platform/database';
import {
  $identity,
  $identityResolved,
  $renameTarget,
  $renameOpened,
  $setupDraft,
  $setupNameChanged,
} from '../../state';
import { $nameDevice } from '../identity';
import { SELF_ID } from './fixtures';

vi.mock('../../platform/database');

const OLD_ID = `e9${'0'.repeat(62)}`;

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(Date, 'now').mockReturnValue(5_000);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('$nameDevice', () => {
  it('refuses before the key lands', async () => {
    await using effects = createTestController();
    const nameDevice = await effects.run($nameDevice);

    await expect(nameDevice('Laptop')).resolves.toBe(false);
    expect(saveContact).not.toHaveBeenCalled();
  });

  it('names the device and writes the normalized row through', async () => {
    await using effects = createTestController();
    const identityResolved = await effects.run($identityResolved);
    const nameDevice = await effects.run($nameDevice);
    identityResolved(SELF_ID);

    await expect(nameDevice('  Laptop  ')).resolves.toBe(true);

    expect(saveContact).toHaveBeenCalledWith({
      kind: 'self',
      endpointId: SELF_ID,
      label: 'Laptop',
      createdAt: 5_000,
    });
    expect(removeContact).not.toHaveBeenCalled();
  });

  it('clears the draft and closes its own rename form', async () => {
    await using effects = createTestController();
    const identityResolved = await effects.run($identityResolved);
    const setupNameChanged = await effects.run($setupNameChanged);
    const renameOpened = await effects.run($renameOpened);
    const nameDevice = await effects.run($nameDevice);
    const draft = await effects.run($setupDraft);
    const renameTarget = await effects.run($renameTarget);
    identityResolved(SELF_ID);
    setupNameChanged('Laptop');
    renameOpened({ kind: 'self' });

    await nameDevice('Laptop');

    expect(draft.name).toBe('');
    expect(renameTarget()).toBeNull();
  });

  it('keeps the original date across renames', async () => {
    await using effects = createTestController();
    const identityResolved = await effects.run($identityResolved);
    const nameDevice = await effects.run($nameDevice);
    const self = await effects.run($identity);
    identityResolved(SELF_ID);
    await nameDevice('First');
    vi.mocked(Date.now).mockReturnValue(9_000);

    await nameDevice('Second');

    expect(self.record).toMatchObject({ label: 'Second', createdAt: 5_000 });
  });

  it('removes the row left at a rotated key', async () => {
    await using effects = createTestController();
    const identityResolved = await effects.run($identityResolved);
    const nameDevice = await effects.run($nameDevice);
    identityResolved(OLD_ID);
    await nameDevice('Laptop');
    identityResolved(SELF_ID);

    await nameDevice('Laptop');

    expect(removeContact).toHaveBeenCalledWith(OLD_ID);
    expect(saveContact).toHaveBeenLastCalledWith(
      expect.objectContaining({ endpointId: SELF_ID }),
    );
  });

  it('fails when the write does', async () => {
    const error = new Error('Testing failures');
    vi.mocked(saveContact).mockRejectedValue(error);
    await using effects = createTestController();
    const identityResolved = await effects.run($identityResolved);
    const nameDevice = await effects.run($nameDevice);
    identityResolved(SELF_ID);

    await expect(nameDevice('Laptop')).rejects.toBe(error);
  });
});
