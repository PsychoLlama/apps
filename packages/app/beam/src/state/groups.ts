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

/**
 * What to call a group on screen. Nobody is asked to name one, so most
 * have no name, and most are someone's own devices.
 */
export const groupLabel = (group: { readonly name: string }): string =>
  group.name || 'My devices';
