import type { IconEntry } from './pack-data.ts';

/**
 * Soft cap on the serialized size of a single page, in bytes. Packs
 * with chunky color SVGs (Fluent Emoji, etc.) blow well past 30 KB
 * gzipped at 500 icons per page; an icon-count budget produces
 * multi-megabyte chunks that defeat the lazy-load goal.
 */
export const DEFAULT_MAX_PAGE_BYTES = 200_000;

/**
 * Lower bound — never emit a page with fewer icons than this even if
 * the byte budget is already blown. Keeps degenerate cases (a single
 * giant icon) from inflating the page count by orders of magnitude.
 */
export const MIN_PAGE_ICONS = 16;

/**
 * Slice the icon list into pages whose serialized payload stays
 * under `maxBytes`. Falls back to `minIcons` per page when a single
 * icon already busts the budget — page sizes are a soft target, not
 * a hard limit. Always emits at least one page so the runtime can
 * use `pages.length === 0` as a "this pack is empty" signal at the
 * pack level instead of the page level.
 */
export const sliceIntoPages = (
  icons: ReadonlyArray<IconEntry>,
  maxBytes: number,
  minIcons: number = MIN_PAGE_ICONS,
): IconEntry[][] => {
  const pages: IconEntry[][] = [];
  let current: IconEntry[] = [];
  let currentBytes = 2; // outer `[]`
  for (const icon of icons) {
    const entrySize = JSON.stringify(icon).length + 1; // entry + comma
    const wouldExceed = currentBytes + entrySize > maxBytes;
    if (wouldExceed && current.length >= minIcons && current.length > 0) {
      pages.push(current);
      current = [];
      currentBytes = 2;
    }
    current.push(icon);
    currentBytes += entrySize;
  }
  if (current.length > 0) pages.push(current);
  if (pages.length === 0) pages.push([]);
  return pages;
};

/**
 * For each page, the index of its first icon within the flattened
 * pack. Lets the runtime locate which page contains a given icon
 * without round-tripping a per-icon page index.
 */
export const pageStartOffsets = (
  pages: ReadonlyArray<ReadonlyArray<IconEntry>>,
): number[] => {
  const offsets: number[] = [];
  let cursor = 0;
  for (const page of pages) {
    offsets.push(cursor);
    cursor += page.length;
  }
  return offsets;
};
