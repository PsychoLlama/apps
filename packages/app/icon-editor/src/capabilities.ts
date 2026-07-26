/**
 * Every side effect the editor's sagas reach for, as plain functions
 * that take the governing `AbortSignal` first and know nothing about
 * state. The underlying fetchers in `icons.ts` cache their promises at
 * module level and are shared between callers, so cancellation checks
 * the signal *after* the await rather than tearing down a request other
 * callers are still waiting on.
 */

import {
  loadIconPackIndex,
  loadIconPackManifest,
  loadIconPage,
  loadIconPageEntries,
  releaseInactivePackCaches,
  resolveIconRef,
  toIconRef,
  type IconPackManifest,
  type IconPackSummary,
  type IconPageRequest,
  type IconPageResult,
  type IconRef,
} from './icons';

/** Load the pack catalog. */
export const fetchPackIndex = async (
  signal: AbortSignal,
): Promise<IconPackSummary[]> => {
  const packs = await loadIconPackIndex();
  signal.throwIfAborted();
  return packs;
};

/** Load one pack's manifest — names plus the URLs of its body chunks. */
export const fetchPackManifest = async (
  signal: AbortSignal,
  pack: IconPackSummary,
): Promise<IconPackManifest> => {
  const manifest = await loadIconPackManifest(pack);
  signal.throwIfAborted();
  return manifest;
};

/** Load a single body chunk, preserving the request that asked for it. */
export const fetchPageEntries = async (
  signal: AbortSignal,
  request: IconPageRequest,
): Promise<IconPageResult> => {
  const result = await loadIconPageEntries(request);
  signal.throwIfAborted();
  return result;
};

/** Resolve a fully-qualified `pack:name` reference. */
export const fetchIconRef = async (
  signal: AbortSignal,
  ref: { pack: string; name: string },
): Promise<IconRef | undefined> => {
  const icon = await resolveIconRef(ref.pack, ref.name);
  signal.throwIfAborted();
  return icon;
};

/**
 * Pull a random icon from a single pack: pick a page, pick an entry.
 * Scoped to `packId` so Randomize rolls a fresh glyph without leaving
 * the pack the user picked. Loads pages on demand — we never hold the
 * full pack in memory.
 */
export const pickRandomIcon = async (
  signal: AbortSignal,
  packId: string,
): Promise<IconRef | undefined> => {
  const packs = await loadIconPackIndex();
  signal.throwIfAborted();

  const pack = packs.find((entry) => entry.id === packId);
  if (!pack) return undefined;

  const manifest = await loadIconPackManifest(pack);
  signal.throwIfAborted();
  if (manifest.pages.length === 0) return undefined;

  const pageIndex = Math.floor(Math.random() * manifest.pages.length);
  const page = await loadIconPage(pack.id, manifest.pages[pageIndex]);
  signal.throwIfAborted();
  if (page.length === 0) return undefined;

  const entry = page[Math.floor(Math.random() * page.length)];
  return toIconRef(
    {
      id: manifest.id,
      width: manifest.width,
      height: manifest.height,
      license: pack.license,
      author: pack.author,
    },
    entry,
  );
};

/**
 * Drop the fetcher's manifest and page caches for every pack other than
 * the one now active. The picker releases its own copy through a fold;
 * this is the module-level half.
 */
export const releasePackCaches = (
  _signal: AbortSignal,
  activePackId: string,
): void => {
  releaseInactivePackCaches(activePackId);
};
