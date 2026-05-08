import type {
  CollectionsJson,
  PackAuthor,
  PackLicense,
  RawPackJson,
} from './iconify.ts';

/**
 * A flat icon entry — the smallest unit the runtime fetches.
 * `width`/`height` are present only when the icon overrides the
 * pack-level viewBox; iconify packs occasionally ship oddly-sized
 * glyphs (Font Awesome's wider icons, brand `logos:*`).
 */
export interface IconEntry {
  /** Icon name within the pack (kebab-case). */
  name: string;
  /** Inner SVG markup, stripped to a single string. */
  body: string;
  /** Per-icon viewBox width override. */
  width?: number;
  /** Per-icon viewBox height override. */
  height?: number;
}

/** Pack metadata + sample previews — the index-level shape. */
export interface PackInfo {
  id: string;
  name: string;
  width: number;
  height: number;
  total: number;
  samples: IconEntry[];
  /** Pack author, when iconify provides one. */
  author?: PackAuthor;
  /** Pack license, when iconify provides one. */
  license?: PackLicense;
}

/** Full processed pack — adds the flattened icon list to {@link PackInfo}. */
export interface PackData extends PackInfo {
  /** All visible icons in pack order — search and pagination key off this. */
  icons: IconEntry[];
}

/** Sample-icon count baked into the index for the picker preview tiles. */
export const SAMPLE_COUNT = 5;

/**
 * Flatten a raw `@iconify/json` pack into our internal shape. Hidden
 * and body-less entries are dropped; per-icon `width`/`height` overrides
 * are kept only when they differ from the pack default.
 */
export const buildPackData = (
  raw: RawPackJson,
  id: string,
  meta: CollectionsJson[string],
): PackData => {
  const width = raw.width ?? raw.height ?? 24;
  const height = raw.height ?? raw.width ?? 24;
  const icons: IconEntry[] = [];
  for (const [iconName, def] of Object.entries(raw.icons)) {
    if (def.hidden) continue;
    if (!def.body) continue;
    const entry: IconEntry = { name: iconName, body: def.body };
    if (def.width !== undefined && def.width !== width) entry.width = def.width;
    if (def.height !== undefined && def.height !== height) {
      entry.height = def.height;
    }
    icons.push(entry);
  }
  return {
    id,
    name: meta.name,
    width,
    height,
    total: icons.length,
    samples: [],
    author: meta.author,
    license: meta.license,
    icons,
  };
};

/**
 * Pick up to `count` preview icons from a pack — preferred names from
 * the iconify metadata first (in their listed order), then a stable
 * fill from the front of the pack so small / metadata-less packs still
 * get a full preview row.
 */
export const pickSamples = (
  icons: IconEntry[],
  preferred: ReadonlyArray<string> | undefined,
  count: number = SAMPLE_COUNT,
): IconEntry[] => {
  const byName = new Map(icons.map((entry) => [entry.name, entry]));
  const out: IconEntry[] = [];
  if (preferred) {
    for (const name of preferred) {
      const entry = byName.get(name);
      if (entry && !out.includes(entry)) out.push(entry);
      if (out.length >= count) break;
    }
  }
  for (let idx = 0; out.length < count && idx < icons.length; idx += 1) {
    if (!out.includes(icons[idx])) out.push(icons[idx]);
  }
  return out;
};
