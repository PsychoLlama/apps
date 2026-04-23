/**
 * Glob patterns for build artifacts and caches that no tool in the
 * workspace should scan. Shared so treefmt / vitest / eslint /
 * knip / … stay in sync instead of each redeclaring a slightly
 * different list.
 */
export const generatedArtifacts: readonly string[] = [
  '**/.direnv/**',
  '**/.nitro/**',
  '**/.output/**',
  '**/.wrangler/**',
  '**/coverage/**',
  '**/dist/**',
  '**/result*/**',
  '**/storybook-static/**',
];
