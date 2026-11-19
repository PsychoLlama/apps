/** Unit tests for the list of groups this device holds. */

import { createTestController } from '@lib/effects/testing';
import {
  $groups,
  $groupsChanged,
  GROUP_NAME_MAX_LENGTH,
  groupLabel,
  normalizeGroupName,
} from '../groups';

describe('$groups', () => {
  it('starts out unknown, which is not the same as empty', async () => {
    await using effects = createTestController();
    const groups = await effects.run($groups);

    expect(groups).toEqual({ loaded: false, list: [] });
  });
});

describe('$groupsChanged', () => {
  it('replaces the list whole', async () => {
    await using effects = createTestController();
    const groups = await effects.run($groups);
    const groupsChanged = await effects.run($groupsChanged);

    groupsChanged([{ id: 'a', name: 'Home', member: true, deviceName: '' }]);
    groupsChanged([{ id: 'b', name: 'Work', member: true, deviceName: '' }]);

    expect(groups).toEqual({
      loaded: true,
      list: [{ id: 'b', name: 'Work', member: true, deviceName: '' }],
    });
  });

  it('marks an empty answer as an answer', async () => {
    await using effects = createTestController();
    const groups = await effects.run($groups);
    const groupsChanged = await effects.run($groupsChanged);

    groupsChanged([]);

    expect(groups).toEqual({ loaded: true, list: [] });
  });
});

describe('normalizeGroupName', () => {
  it('trims', () => {
    expect(normalizeGroupName('  My devices ')).toBe('My devices');
  });

  it('refuses nothing, and too much', () => {
    expect(normalizeGroupName('  ')).toBeNull();
    expect(
      normalizeGroupName('x'.repeat(GROUP_NAME_MAX_LENGTH + 1)),
    ).toBeNull();
  });
});

describe('groupLabel', () => {
  it('names a group that has no name', () => {
    expect(groupLabel({ name: 'Home' })).toBe('Home');
    expect(groupLabel({ name: '' })).toBe('Unnamed group');
  });
});
