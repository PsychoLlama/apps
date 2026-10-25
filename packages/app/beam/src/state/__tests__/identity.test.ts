/**
 * Unit tests for this device's identity: its address, its name, and the
 * code that hands both over.
 */

import { createTestController } from '@lib/effects/testing';
import type { QrGrid } from '../../platform/qr-code';
import { $renameTarget, $renameOpened } from '../dialogs';
import {
  $codeEncoded,
  $deviceNamed,
  $identity,
  $identityResolved,
  $qrCode,
  deviceFallbackOf,
  deviceNameOf,
} from '../identity';
import { $setupName, $setupNameChanged } from '../onboarding';

const KEY = 'abcdef0123456789';

describe('$identity', () => {
  it('starts with no address and no name', async () => {
    await using effects = createTestController();
    const self = await effects.run($identity);

    expect(self.endpointId).toBeNull();
    expect(self.record).toBeNull();
  });
});

describe('$identityResolved', () => {
  it('settles this device’s address', async () => {
    await using effects = createTestController();
    const self = await effects.run($identity);
    const identityResolved = await effects.run($identityResolved);

    identityResolved(KEY);

    expect(self.endpointId).toBe(KEY);
  });
});

describe('$deviceNamed', () => {
  it('writes the name against this device’s address', async () => {
    await using effects = createTestController();
    const self = await effects.run($identity);
    const deviceNamed = await effects.run($deviceNamed);

    deviceNamed(KEY, 'Laptop', 5);

    expect(self.record).toEqual({
      kind: 'self',
      endpointId: KEY,
      label: 'Laptop',
      createdAt: 5,
    });
  });

  it('normalizes the name on the way in', async () => {
    await using effects = createTestController();
    const self = await effects.run($identity);
    const deviceNamed = await effects.run($deviceNamed);

    deviceNamed(KEY, '  Laptop\n ', 5);

    expect(self.record?.label).toBe('Laptop');
  });

  it('clears the name when the field is emptied or dropped', async () => {
    await using effects = createTestController();
    const self = await effects.run($identity);
    const deviceNamed = await effects.run($deviceNamed);

    deviceNamed(KEY, '   ', 5);
    expect(self.record?.label).toBeNull();

    deviceNamed(KEY, null, 6);
    expect(self.record?.label).toBeNull();
  });

  it('keeps the date the device was first named', async () => {
    await using effects = createTestController();
    const self = await effects.run($identity);
    const deviceNamed = await effects.run($deviceNamed);

    deviceNamed(KEY, 'One', 5);
    deviceNamed(KEY, 'Two', 9);

    expect(self.record).toMatchObject({ label: 'Two', createdAt: 5 });
  });

  it('moves the row when the key underneath it changed', async () => {
    await using effects = createTestController();
    const self = await effects.run($identity);
    const deviceNamed = await effects.run($deviceNamed);

    deviceNamed('old-key', 'Laptop', 5);
    deviceNamed('new-key', 'Laptop', 9);

    expect(self.record).toMatchObject({ endpointId: 'new-key', createdAt: 5 });
  });

  it('clears the setup draft once the name lands', async () => {
    await using effects = createTestController();
    const setupName = await effects.run($setupName);
    const deviceNamed = await effects.run($deviceNamed);
    const setupNameChanged = await effects.run($setupNameChanged);
    setupNameChanged('Laptop');

    deviceNamed(KEY, 'Laptop', 5);

    expect(setupName()).toBe('');
  });

  it('closes this device’s rename form', async () => {
    await using effects = createTestController();
    const renameTarget = await effects.run($renameTarget);
    const deviceNamed = await effects.run($deviceNamed);
    const renameOpened = await effects.run($renameOpened);
    renameOpened({ kind: 'self' });

    deviceNamed(KEY, 'Laptop', 5);

    expect(renameTarget()).toBeNull();
  });

  it('leaves a contact’s rename form open', async () => {
    await using effects = createTestController();
    const renameTarget = await effects.run($renameTarget);
    const deviceNamed = await effects.run($deviceNamed);
    const renameOpened = await effects.run($renameOpened);
    renameOpened({ kind: 'peer', endpointId: 'ep-1' });

    deviceNamed(KEY, 'Laptop', 5);

    expect(renameTarget()).toEqual({ kind: 'peer', endpointId: 'ep-1' });
  });
});

describe('$codeEncoded', () => {
  it('starts without a code', async () => {
    await using effects = createTestController();
    const code = await effects.run($qrCode);

    expect(code()).toBeNull();
  });

  it('holds the grid it was given, unproxied', async () => {
    await using effects = createTestController();
    const code = await effects.run($qrCode);
    const codeEncoded = await effects.run($codeEncoded);
    const grid: QrGrid = { size: 2, modules: new Uint8Array([1, 0, 0, 1]) };

    codeEncoded(grid);

    expect(code()).toBe(grid);
  });

  it('lands a failed encode as no code', async () => {
    await using effects = createTestController();
    const code = await effects.run($qrCode);
    const codeEncoded = await effects.run($codeEncoded);

    codeEncoded({ size: 1, modules: new Uint8Array([1]) });
    codeEncoded(null);

    expect(code()).toBeNull();
  });
});

describe('deviceNameOf', () => {
  it('has nothing to say before the key lands', () => {
    expect(deviceNameOf({ endpointId: null, record: null })).toBeNull();
  });

  it('answers with the name the reader chose', () => {
    const record = {
      kind: 'self' as const,
      endpointId: KEY,
      label: 'Laptop',
      createdAt: 1,
    };

    expect(deviceNameOf({ endpointId: KEY, record })).toBe('Laptop');
  });

  it('falls back to the prefix of the live key', () => {
    const record = {
      kind: 'self' as const,
      endpointId: 'stale-key',
      label: null,
      createdAt: 1,
    };

    expect(deviceNameOf({ endpointId: KEY, record })).toBe('abcdef01');
  });
});

describe('deviceFallbackOf', () => {
  it('has nothing to fall back to before the key lands', () => {
    expect(deviceFallbackOf({ endpointId: null, record: null })).toBe('');
  });

  it('answers with the key prefix, named or not', () => {
    const record = {
      kind: 'self' as const,
      endpointId: KEY,
      label: 'Laptop',
      createdAt: 1,
    };

    expect(deviceFallbackOf({ endpointId: KEY, record })).toBe('abcdef01');
  });
});
