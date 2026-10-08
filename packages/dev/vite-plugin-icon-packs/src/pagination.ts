import type { IconEntry } from './pack-data.ts';

/**
 * Default page size in icons. The runtime fetches one page per
 * scroll-into-view, so this trades request count against per-request
 * payload — 500 keeps individual responses small while letting the
 * browser viewport pull in a comfortable chunk per fetch.
 */
export const DEFAULT_PAGE_SIZE = 500;

/**
 * Slice the icon list into fixed-count pages. Always emits at least
 * one page so the runtime can use `pages.length === 0` as a "this
 * pack is empty" signal at the pack level instead of the page level.
 */
export const sliceIntoPages = (
  icons: ReadonlyArray<IconEntry>,
  pageSize: number = DEFAULT_PAGE_SIZE,
): IconEntry[][] => {
  const pages: IconEntry[][] = [];
  for (let start = 0; start < icons.length; start += pageSize) {
    pages.push(icons.slice(start, start + pageSize));
  }
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
