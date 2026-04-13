/**
 * Directories ignored by Vite/Vitest file watchers.
 *
 * Vite's chokidar watcher does not respect .gitignore, so build
 * artifacts and tool directories must be excluded explicitly.
 */
export const watchIgnore = [
  '**/.direnv/**',
  '**/.claude/**',
  '**/.nitro/**',
  '**/.output/**',
  '**/.wrangler/**',
  '**/storybook-static/**',
  '**/result*/**',
];
