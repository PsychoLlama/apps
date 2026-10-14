import type { HeadersRule } from './headers.ts';

/** Rules every build gets, ahead of the configured ones. */
export const DEFAULT_RULES: readonly HeadersRule[] = [
  // Cache policy: files under `/_build/` are immutable and cached
  // indefinitely. Everything else needing a stable URL (`.html`,
  // `/manifest.webmanifest`) gets Cloudflare's default revalidation.
  //
  // Safe only because `assertHashedAssets` (in substrate) fails the build
  // if anything under `/_build/` emits without a content hash.
  {
    pattern: '/_build/*',
    headers: { 'Cache-Control': 'public, immutable, max-age=31536000' },
  },
];
