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

/**
 * Absolute-path glob for the workspace's `.claude` scratch directory
 * (agent settings, skills, worktrees). Intended for chokidar-style
 * `ignored` lists in vite / vitest configs.
 *
 * Takes the caller's workspace root so the pattern only matches that
 * workspace's own `.claude`, not every ancestor. A free-floating
 * globstar would filter out every path when the config runs from
 * inside a worktree checkout at `<root>/.claude/worktrees/<name>/`.
 *
 * @param workspaceRoot - absolute path to the workspace root.
 */
export const scratchDir = (workspaceRoot: string): string =>
  `${workspaceRoot}/.claude/**`;
