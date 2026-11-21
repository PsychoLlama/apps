import type { Group } from '@crate/beam';
import { defineCommand, defineStore } from '@lib/state';

/** Longest name a group can be given. A label, not a description. */
export const GROUP_NAME_MAX_LENGTH = 60;

/** The groups this device holds, as last read from its database. */
export interface GroupsState {
  /**
   * Whether the database has answered yet. Until it has, an empty list
   * means "not known", not "none".
   */
  loaded: boolean;

  /** Every group this device holds, by name. */
  list: Group[];
}

/** The groups this device holds. */
export const $groups = defineStore<GroupsState>(() => ({
  loaded: false,
  list: [],
}));

/** The database listed its groups again. Replaces the list whole. */
export const $groupsChanged = defineCommand(
  [$groups],
  (groups) => (list: Group[]) => {
    groups.loaded = true;
    groups.list = list;
  },
);

/**
 * A group name as it's stored: trimmed, or `null` if it runs too long.
 * Nothing at all is a name too: the group goes without one.
 */
export const normalizeGroupName = (name: string): string | null => {
  const trimmed = name.trim();

  return trimmed.length <= GROUP_NAME_MAX_LENGTH ? trimmed : null;
};

/** What a group someone asked for is called until they rename it. */
const NEW_GROUP_NAME = 'New group';

/**
 * A name for another group, unlike any this device already shows: `New
 * group`, then `New group (1)`, and so on.
 *
 * A device's first group goes unnamed and reads as its {@link groupLabel}.
 * Any after that was asked for, and two rows reading the same would be
 * told apart by nothing.
 *
 * Only as good as what this device holds. Two devices can still give two
 * groups one name, and either can be renamed.
 */
export const nextGroupName = (
  groups: readonly { readonly name: string }[],
): string => {
  const taken = new Set(groups.map((group) => groupLabel(group).toLowerCase()));

  for (let count = 0; ; count++) {
    const name =
      count === 0 ? NEW_GROUP_NAME : `${NEW_GROUP_NAME} (${String(count)})`;

    if (!taken.has(name.toLowerCase())) return name;
  }
};

/**
 * What to call a group on screen. Nobody is asked to name one, so most
 * have no name, and most are someone's own devices.
 */
export const groupLabel = (group: { readonly name: string }): string =>
  group.name || 'My devices';
