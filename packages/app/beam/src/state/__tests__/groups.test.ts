/** Unit tests for the list of groups this device holds. */

import { createTestController } from '@lib/effects/testing';
import {
  $groups,
  $groupsChanged,
  GROUP_NAME_MAX_LENGTH,
  groupLabel,
  nextGroupName,
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
    expect(normalizeGroupName('  ')).toBe('');
    expect(
      normalizeGroupName('x'.repeat(GROUP_NAME_MAX_LENGTH + 1)),
    ).toBeNull();
  });
});

describe('groupLabel', () => {
  it('names a group that has no name', () => {
    expect(groupLabel({ name: 'Home' })).toBe('Home');
    expect(groupLabel({ name: '' })).toBe('My devices');
  });
});

describe('nextGroupName', () => {
  it('starts plain', () => {
    expect(nextGroupName([])).toBe('New group');
    expect(nextGroupName([{ name: '' }, { name: 'Family' }])).toBe('New group');
  });

  it('counts past the names already taken', () => {
    expect(nextGroupName([{ name: 'New group' }])).toBe('New group (1)');
    expect(
      nextGroupName([{ name: 'New group' }, { name: 'New group (1)' }]),
    ).toBe('New group (2)');
  });

  it('fills a gap, and reads names without minding their case', () => {
    expect(
      nextGroupName([{ name: 'new GROUP' }, { name: 'New group (2)' }]),
    ).toBe('New group (1)');
  });
});
