import type { Item, Member } from '@crate/beam';
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

  /** The devices in the group. Empty until the database has answered. */
  members: Member[];
}

/** The feed of the group on screen. */
export const $feed = defineStore<FeedState>(() => ({
  groupId: null,
  loaded: false,
  items: [],
  members: [],
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
    feed.members = [];
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
 * The database listed a group's devices again. Replaces them whole, unless
 * the page has moved on to another group.
 */
export const $membersChanged = defineCommand(
  [$feed],
  (feed) => (groupId: string, members: Member[]) => {
    if (feed.groupId !== groupId) return;

    feed.members = members;
  },
);

/** The kinds of item the app writes for itself that this build can show. */
const SYSTEM_KINDS = new Set(['welcome']);

/**
 * Whether an item has a place in the feed. One the app wrote for itself
 * has none if this build doesn't know its kind: a newer build on another
 * device wrote it, and there's nothing here to say for it.
 */
export const isShown = (item: { readonly system?: string }): boolean =>
  item.system === undefined || SYSTEM_KINDS.has(item.system);

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

/**
 * Image types shown inline. Formats a browser decodes as pixels and
 * nothing else: SVG is a document, and stays a file.
 */
const PREVIEWED = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/avif',
]);

/**
 * Types a click opens in a tab of its own, and the type the browser is
 * told each is. Everything else is saved instead.
 *
 * An allowlist, and a short one, because an opened file is shown from
 * this app's origin. A type that can carry a script (HTML, SVG, XML)
 * would run it with the run of everything this device holds. These are
 * formats a browser draws or plays and does nothing else with.
 */
const OPENED = new Map([
  ...[...PREVIEWED].map((type) => [type, type] as const),
  ['application/pdf', 'application/pdf'],

  // Said outright, so nothing is left for the browser to guess at.
  ['text/plain', 'text/plain;charset=utf-8'],
  ['video/mp4', 'video/mp4'],
  ['video/webm', 'video/webm'],
  ['audio/mpeg', 'audio/mpeg'],
  ['audio/mp4', 'audio/mp4'],
  ['audio/ogg', 'audio/ogg'],
  ['audio/wav', 'audio/wav'],
  ['audio/webm', 'audio/webm'],
]);

/**
 * The type to open a file as, or `null` if it's one to save and never
 * open. The file's own type is another device's word: it picks from the
 * list and is never passed on, parameters and all, to the browser.
 */
export const openableType = (file: { readonly type: string }): string | null =>
  OPENED.get(file.type.split(';')[0]?.trim().toLowerCase() ?? '') ?? null;

/** The largest image read back in to show, in bytes. */
const PREVIEW_MAX_BYTES = 20 * 1024 * 1024;

/**
 * Whether a file is shown as a picture where it sits in the feed. Its
 * type is another device's word, so it's matched against a short list
 * and never trusted further than choosing how to draw.
 */
export const isPreviewable = (file: {
  readonly type: string;
  readonly size: number;
}): boolean => PREVIEWED.has(file.type) && file.size <= PREVIEW_MAX_BYTES;
