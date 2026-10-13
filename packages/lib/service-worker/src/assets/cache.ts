/** Bump the version when the meaning of cached entries changes. */
export const CACHE_NAME = 'assets:1';

/**
 * The Cache API only takes request URLs as keys, so the hash becomes one.
 * Nothing ever fetches it.
 */
export const cacheKey = (integrityHash: string) =>
  new URL(`/${encodeURIComponent(integrityHash)}`, self.location.origin).href;
