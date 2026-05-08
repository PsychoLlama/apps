/**
 * Runtime fetcher for the iconify pack catalog. The build emits the
 * full `@iconify/json` corpus as paginated JSON assets behind a
 * `virtual:icon-packs` URL — this module is the only consumer that
 * knows the on-the-wire shape, and exposes typed lookups + an
 * in-memory cache so repeat browses through the same pack are free.
 */

/// <reference types="@dev/build/vite-plugin/icon-packs-types" />

import indexUrl from 'virtual:icon-packs';

/** A single icon entry — name + raw inner SVG markup (uses currentColor). */
export interface IconEntry {
  /** Icon name within its pack (kebab-case). */
  name: string;
  /** Inner SVG markup. Always rendered against the pack's viewBox. */
  body: string;
}

/** A fully-qualified icon — a pack id + an {@link IconEntry}. */
export interface IconRef extends IconEntry {
  /** Pack id (matches `IconPackSummary.id`). */
  pack: string;
  /** Native SVG width for this pack — drives the rendered viewBox. */
  width: number;
  /** Native SVG height for this pack. */
  height: number;
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
  /** URL of the pack's manifest asset — fetched on selection. */
  manifestUrl: string;
}

/** Per-pack manifest — names plus URLs of paginated body chunks. */
export interface IconPackManifest {
  id: string;
  name: string;
  width: number;
  height: number;
  pageSize: number;
  total: number;
  /** All icon names in pack order. Powers search + page lookup. */
  names: ReadonlyArray<string>;
  /** URLs of page chunks, in order. */
  pages: ReadonlyArray<string>;
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
const pageCache = new Map<string, Promise<IconEntry[]>>();

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

/** Load a single page chunk — array of `{ name, body }`. Cached by URL. */
export const loadIconPage = (pageUrl: string): Promise<IconEntry[]> => {
  const cached = pageCache.get(pageUrl);
  if (cached) return cached;
  const promise = fetchJson<IconEntry[]>(pageUrl);
  pageCache.set(pageUrl, promise);
  return promise;
};

/** Encode a `pack:name` reference for URL params. */
export const encodeIconRef = (ref: { pack: string; name: string }): string =>
  `${ref.pack}:${ref.name}`;

/** Parse a `pack:name` reference. Returns `undefined` for malformed input. */
export const parseIconRef = (
  encoded: string,
): { pack: string; name: string } | undefined => {
  const colon = encoded.indexOf(':');
  if (colon <= 0 || colon >= encoded.length - 1) return undefined;
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

/** Page index that contains a given icon position. */
export const pageIndexFor = (manifest: IconPackManifest, position: number) =>
  Math.floor(position / manifest.pageSize);

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
  const entries = await loadIconPage(request.pageUrl);
  return { packId: request.packId, pageUrl: request.pageUrl, entries };
};

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
  const page = await loadIconPage(pageUrl);
  const entry = page.find((icon) => icon.name === name);
  if (!entry) return undefined;
  return {
    pack: summary.id,
    name: entry.name,
    body: entry.body,
    width: manifest.width,
    height: manifest.height,
  };
};
