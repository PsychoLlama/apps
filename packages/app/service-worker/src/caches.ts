/**
 * Single source of truth for every named Cache Storage bucket the
 * service worker reads or writes. Embedding a version suffix in each
 * name lets `purgeStaleCaches` drop stale buckets whose schema or
 * population rules have changed — bump the integer when the
 * *meaning* of cached entries shifts, not when their contents drift.
 */
export const CACHE_NAMES = {
  /** Lazy-populated HTML responses for offline navigations. */
  html: 'html:1',
} as const satisfies Record<string, string>;

/** Union of every cache name currently in use. */
export type CacheName = (typeof CACHE_NAMES)[keyof typeof CACHE_NAMES];

// Typed as `ReadonlySet<string>` (not `Set<CacheName>`) so the
// cleanup loop can test arbitrary strings returned from
// `caches.keys()` without a cast.
const activeCacheNames: ReadonlySet<string> = new Set(
  Object.values(CACHE_NAMES),
);

/**
 * Typed wrapper around `caches.open` that constrains the name to a
 * known cache. Call sites can't pass arbitrary strings, so a rename
 * surfaces as a compile error rather than an orphan cache.
 */
export const openCache = (name: CacheName): Promise<Cache> => caches.open(name);

/**
 * Drop any Cache Storage bucket not listed in `CACHE_NAMES`. Call
 * from the `activate` event so retired cache names don't accumulate
 * on disk after a strategy change.
 */
export const purgeStaleCaches = async (): Promise<void> => {
  const names = await caches.keys();
  await Promise.all(
    names
      .filter((name) => !activeCacheNames.has(name))
      .map((name) => caches.delete(name)),
  );
};
