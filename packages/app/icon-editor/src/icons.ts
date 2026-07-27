/**
 * The on-the-wire shape of the iconify pack catalog, plus the pure
 * lookups that read it. The build emits the full `@iconify/json` corpus
 * as paginated JSON assets; this module knows what those assets contain
 * and nothing about how they arrive — fetching lives in
 * `capabilities.ts`, and the results live in state.
 */

/**
 * A single icon entry. Most iconify packs share one viewBox across
 * every icon, but a few (Font Awesome's wider glyphs) override
 * per-icon — `width`/`height` are absent when the icon uses the
 * pack default.
 */
export interface IconEntry {
  /** Icon name within its pack (kebab-case). */
  name: string;
  /** Inner SVG markup. Always rendered against the pack's viewBox. */
  body: string;
  /** Per-icon viewBox width override. */
  width?: number;
  /** Per-icon viewBox height override. */
  height?: number;
}

/**
 * A fully-qualified icon — a pack id + an {@link IconEntry} with the
 * effective viewBox dimensions resolved (per-icon overrides win,
 * pack defaults fill in otherwise). License + author travel with the
 * ref so the export panel can show attribution and the SVG metadata
 * stamp can write it without re-fetching the index.
 */
export interface IconRef {
  /** Pack id (matches `IconPackSummary.id`). */
  pack: string;
  /** Icon name within the pack. */
  name: string;
  /** Inner SVG markup. */
  body: string;
  /** Effective viewBox width — per-icon override or pack default. */
  width: number;
  /** Effective viewBox height. */
  height: number;
  /** Pack license, when iconify provides one. */
  license?: IconPackLicense;
  /** Pack author, when iconify provides one. */
  author?: IconPackAuthor;
}

/** Pack author as iconify exposes it. */
export interface IconPackAuthor {
  name: string;
  /** Optional homepage / source URL. */
  url?: string;
}

/**
 * Pack license as iconify exposes it. Surfaced in the picker so users
 * see how a pack is licensed before they commit to it; included in
 * exported SVG metadata so attribution travels with the file.
 */
export interface IconPackLicense {
  /** Human-readable label, e.g. `"MIT"`. */
  title?: string;
  /** SPDX identifier, e.g. `"MIT"` or `"CC-BY-4.0"`. */
  spdx?: string;
  /** Link to the upstream license. */
  url?: string;
}

/** Picker-level metadata for a single pack — small, baked into the index. */
export interface IconPackSummary {
  /** Stable pack id (e.g. `mdi`, `material-symbols`). */
  id: string;
  /** Human-readable pack name. */
  name: string;
  /** Total renderable icons in the pack. */
  total: number;
  /** Native viewBox width — every icon in the pack shares it. */
  width: number;
  /** Native viewBox height. */
  height: number;
  /** A handful of icons with bodies, sufficient to render preview tiles. */
  samples: ReadonlyArray<IconEntry>;
  /** Pack author, when iconify provides one. */
  author?: IconPackAuthor;
  /** Pack license, when iconify provides one. */
  license?: IconPackLicense;
  /** URL of the pack's manifest asset — fetched on selection. */
  manifestUrl: string;
}

/**
 * Per-pack manifest — names plus URLs of paginated body chunks.
 * Pages are byte-budgeted, so each one's icon count varies;
 * `pageStart` records the first-icon index for each page so the
 * runtime can map a name's pack-position back to its page.
 */
export interface IconPackManifest {
  id: string;
  name: string;
  /** Pack-default viewBox width — overridden per-icon when present. */
  width: number;
  /** Pack-default viewBox height. */
  height: number;
  total: number;
  /** All icon names in pack order. Powers search + page lookup. */
  names: ReadonlyArray<string>;
  /** URLs of page chunks, in order. */
  pages: ReadonlyArray<string>;
  /** First-icon index for each page — `pageStart[i]` corresponds to `pages[i]`. */
  pageStart: ReadonlyArray<number>;
}

/** The index asset's payload — a bare envelope around the pack list. */
export interface IconIndexPayload {
  packs: IconPackSummary[];
}

/**
 * Encode a `pack:name` reference for URL params. Returns the empty
 * string for an absent icon — the URL-mirror effect treats that as
 * "drop the param" via {@link paramOrNull}.
 */
export const encodeIconRef = (
  ref: { pack: string; name: string } | undefined,
): string => (ref ? `${ref.pack}:${ref.name}` : '');

/**
 * Parse a `pack:name` reference. Bare names without a colon are
 * accepted as MDI icons — pre-multipack URLs encoded `?icon=cog`,
 * and shareable links shouldn't break when readers visit them.
 * Returns `undefined` only for empty input or partially-empty halves
 * (e.g. `:foo`, `mdi:`).
 */
export const parseIconRef = (
  encoded: string,
): { pack: string; name: string } | undefined => {
  if (encoded.length === 0) return undefined;
  const colon = encoded.indexOf(':');
  if (colon === -1) {
    return { pack: 'mdi', name: encoded };
  }
  if (colon === 0 || colon === encoded.length - 1) return undefined;
  return {
    pack: encoded.slice(0, colon),
    name: encoded.slice(colon + 1),
  };
};

/** Look up an icon by name in a manifest's name list. */
export const findIconIndex = (
  manifest: IconPackManifest,
  name: string,
): number => manifest.names.indexOf(name);

/**
 * Page index that contains a given icon position. Walks
 * `pageStart` from the back since most positions sit in later
 * pages once the user has scrolled past the alphabet.
 */
export const pageIndexFor = (
  manifest: IconPackManifest,
  position: number,
): number => {
  for (let idx = manifest.pageStart.length - 1; idx >= 0; idx -= 1) {
    if (position >= manifest.pageStart[idx]) return idx;
  }
  return 0;
};

/** Coords identifying one body chunk: which pack, and which asset. */
export interface IconPageRequest {
  packId: string;
  pageUrl: string;
}

/** A landed body chunk — the originating request plus its entries. */
export interface IconPageResult {
  packId: string;
  pageUrl: string;
  entries: ReadonlyArray<IconEntry>;
}

/** The name range one chunk covers, as `[start, end)` into `names`. */
export const pageNameRange = (
  manifest: IconPackManifest,
  pageIndex: number,
): readonly [start: number, end: number] => [
  manifest.pageStart[pageIndex] ?? 0,
  manifest.pageStart[pageIndex + 1] ?? manifest.total,
];

/**
 * Materialize an {@link IconRef} from an icon entry plus its host
 * pack metadata. Per-icon viewBox overrides win over the pack
 * default. Callers can pass either a manifest (no license/author) or
 * a summary (carries both); the optional fields land on the ref when
 * the source has them.
 */
export const toIconRef = (
  source: {
    id: string;
    width: number;
    height: number;
    license?: IconPackLicense;
    author?: IconPackAuthor;
  },
  entry: IconEntry,
): IconRef => ({
  pack: source.id,
  name: entry.name,
  body: entry.body,
  width: entry.width ?? source.width,
  height: entry.height ?? source.height,
  license: source.license,
  author: source.author,
});
