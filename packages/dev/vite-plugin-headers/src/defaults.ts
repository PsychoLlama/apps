import type { HeadersRule } from './headers.ts';

/**
 * Rules every build gets, ahead of the configured ones. See
 * `docs/asset-caching.md` for the cache policy.
 */
export const DEFAULT_RULES: readonly HeadersRule[] = [
  // Safe only because `assertHashedAssets` keeps every file under
  // `/_build/` content-hashed.
  {
    pattern: '/_build/*',
    headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
  },
];
