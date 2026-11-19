import type { Item } from '@crate/beam';
import { defineCommand, defineStore } from '@lib/state';

/**
 * Longest note or link that can be shared, in characters. Anything bigger
 * is a file.
 */
export const ITEM_MAX_LENGTH = 4000;

/** What one group holds, for the group on screen. */
export interface FeedState {
  /** The group being looked at, or `null` when none is. */
  groupId: string | null;

  /**
   * Whether the database has answered for this group yet. Until it has,
   * an empty feed means "not known", not "nothing shared".
   */
  loaded: boolean;

  /** Everything shared to the group, oldest first. */
  items: Item[];
}

/** The feed of the group on screen. */
export const $feed = defineStore<FeedState>(() => ({
  groupId: null,
  loaded: false,
  items: [],
}));

/**
 * The page turned to a group, or away from all of them. Whatever the feed
 * held belonged to the last one, so it's emptied until the new one answers.
 */
export const $groupViewed = defineCommand(
  [$feed],
  (feed) => (groupId: string | null) => {
    if (feed.groupId === groupId) return;

    feed.groupId = groupId;
    feed.loaded = false;
    feed.items = [];
  },
);

/**
 * The database read a group's items again. Replaces the feed whole, unless
 * the page has moved on to another group since the read was asked for.
 */
export const $feedChanged = defineCommand(
  [$feed],
  (feed) => (groupId: string, items: Item[]) => {
    if (feed.groupId !== groupId) return;

    feed.loaded = true;
    feed.items = items;
  },
);

/**
 * Something to share as it's stored: trimmed, or `null` if nothing is left
 * or it runs too long.
 */
export const normalizeBody = (body: string): string | null => {
  const trimmed = body.trim();

  return trimmed.length > 0 && trimmed.length <= ITEM_MAX_LENGTH
    ? trimmed
    : null;
};

/**
 * The address a shared item points at, if the whole of it is a web link.
 * Only `http` and `https`: an item came from another device, and anything
 * else it calls a link is not one this app will open.
 */
export const linkOf = (body: string): string | null => {
  if (/\s/.test(body) || !URL.canParse(body)) return null;

  const { protocol, href } = new URL(body);
  return protocol === 'https:' || protocol === 'http:' ? href : null;
};

/**
 * The most of a shared file's name that's used to save it. The name is
 * another device's word, and a file system has a limit of its own.
 */
export const FILE_NAME_MAX_LENGTH = 200;

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/** A byte count as people read one: `0 B`, `512 B`, `1.4 MB`. */
export const formatBytes = (bytes: number): string => {
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }

  // Whole bytes, and whole numbers once there are three digits of them.
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  return `${value.toFixed(digits)} ${BYTE_UNITS[unit] ?? 'B'}`;
};
