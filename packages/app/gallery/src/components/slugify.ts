/**
 * Lowercase a title to a hyphenated slug. Used to derive stable `testId`s
 * from listing/section titles — not for anchor `id`s, which keep the raw
 * title so the fragment matches the heading's casing (e.g. `#BlockQuote`).
 */
export const slugify = (title: string): string =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
