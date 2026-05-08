/**
 * Runtime fetcher for the iconify pack catalog. The build emits the
 * full `@iconify/json` corpus as paginated JSON assets behind a
 * `virtual:icon-packs` URL — this module is the only consumer that
 * knows the on-the-wire shape, and exposes typed lookups + an
 * in-memory cache so repeat browses through the same pack are free.
 */

/// <reference types="@dev/build/vite-plugin/icon-packs-types" />

import indexUrl from 'virtual:icon-packs';

/**
 * A single icon entry. Most iconify packs share one viewBox across
 * every icon, but a few (Font Awesome's wider glyphs, brand-y
 * `logos:*` entries) override per-icon — `width`/`height` are
 * absent when the icon uses the pack default.
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
 * pack defaults fill in otherwise).
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

/** Hard-coded default — keeps the editor renderable before any fetch. */
export const DEFAULT_ICON: IconRef = {
  pack: 'mdi',
  name: 'home',
  body: '<path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8z"/>',
  width: 24,
  height: 24,
};

interface IndexPayload {
  packs: IconPackSummary[];
}

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return (await response.json()) as T;
};

let indexPromise: Promise<IconPackSummary[]> | undefined;
const manifestCache = new Map<string, Promise<IconPackManifest>>();
// Per-pack page cache so eviction is precise. Outer key is pack id;
// inner key is page URL. A flat URL→entries map saved one indirection
// but conflated packs — switching away from a heavy pack couldn't
// reclaim its pages without scanning every URL.
const pageCache = new Map<string, Map<string, Promise<IconEntry[]>>>();

const pageCacheFor = (packId: string): Map<string, Promise<IconEntry[]>> => {
  let inner = pageCache.get(packId);
  if (!inner) {
    inner = new Map();
    pageCache.set(packId, inner);
  }
  return inner;
};

/** Load the pack catalog. Cached after the first call. */
export const loadIconPackIndex = (): Promise<IconPackSummary[]> => {
  indexPromise ??= fetchJson<IndexPayload>(indexUrl).then(
    (payload) => payload.packs,
  );
  return indexPromise;
};

/** Load a pack's manifest (names + page URLs). Cached per pack id. */
export const loadIconPackManifest = (
  pack: IconPackSummary,
): Promise<IconPackManifest> => {
  const cached = manifestCache.get(pack.id);
  if (cached) return cached;
  const promise = fetchJson<IconPackManifest>(pack.manifestUrl);
  manifestCache.set(pack.id, promise);
  return promise;
};

/**
 * Load a single page chunk — array of `{ name, body }`. Cached per
 * `(packId, pageUrl)` so {@link releaseInactivePackCaches} can drop
 * a whole pack's worth of pages in one shot.
 */
export const loadIconPage = (
  packId: string,
  pageUrl: string,
): Promise<IconEntry[]> => {
  const inner = pageCacheFor(packId);
  const cached = inner.get(pageUrl);
  if (cached) return cached;
  const promise = fetchJson<IconEntry[]>(pageUrl);
  inner.set(pageUrl, promise);
  return promise;
};

/**
 * Drop manifests + pages for any pack other than `activePackId`.
 * The browser's HTTP cache covers the case where the user comes
 * back — re-fetching is cheap, while keeping every visited pack's
 * names array (one string per icon, ~7000 for MDI) and bodies in
 * memory adds up fast across the catalog.
 */
export const releaseInactivePackCaches = (activePackId: string): void => {
  for (const key of [...manifestCache.keys()]) {
    if (key !== activePackId) manifestCache.delete(key);
  }
  for (const key of [...pageCache.keys()]) {
    if (key !== activePackId) pageCache.delete(key);
  }
};

/** Encode a `pack:name` reference for URL params. */
export const encodeIconRef = (ref: { pack: string; name: string }): string =>
  `${ref.pack}:${ref.name}`;

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

/** Coords for fetching a single page's entries, threaded through {@link loadIconPageEntries}. */
export interface IconPageRequest {
  packId: string;
  pageUrl: string;
}

/** Result of {@link loadIconPageEntries} — the original request plus its entries. */
export interface IconPageResult {
  packId: string;
  pageUrl: string;
  entries: ReadonlyArray<IconEntry>;
}

/**
 * Fetch a single page's entries while preserving the originating
 * request — pure capability that side-effecting plumbing
 * (`defineEffect`) can wrap.
 */
export const loadIconPageEntries = async (
  request: IconPageRequest,
): Promise<IconPageResult> => {
  const entries = await loadIconPage(request.packId, request.pageUrl);
  return { packId: request.packId, pageUrl: request.pageUrl, entries };
};

/**
 * Materialize an {@link IconRef} from an icon entry plus its host
 * manifest. Per-icon viewBox overrides win over the pack default.
 */
export const toIconRef = (
  manifest: { id: string; width: number; height: number },
  entry: IconEntry,
): IconRef => ({
  pack: manifest.id,
  name: entry.name,
  body: entry.body,
  width: entry.width ?? manifest.width,
  height: entry.height ?? manifest.height,
});

/**
 * Resolve a fully-qualified `pack:name` reference, fetching whatever
 * pages and manifest are needed. Returns `undefined` when the pack
 * or icon doesn't exist.
 */
export const resolveIconRef = async (
  pack: string,
  name: string,
): Promise<IconRef | undefined> => {
  const packs = await loadIconPackIndex();
  const summary = packs.find((entry) => entry.id === pack);
  if (!summary) return undefined;
  const manifest = await loadIconPackManifest(summary);
  const position = findIconIndex(manifest, name);
  if (position < 0) return undefined;
  const pageUrl = manifest.pages[pageIndexFor(manifest, position)];
  const page = await loadIconPage(summary.id, pageUrl);
  const entry = page.find((icon) => icon.name === name);
  if (!entry) return undefined;
  return toIconRef(manifest, entry);
};
