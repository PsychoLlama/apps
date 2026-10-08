import { isAbsolute, relative, resolve } from 'node:path';
import { load, queryWorktreeRoot } from '@dev/gitignore';
import type { Plugin } from 'vite';

/**
 * Keeps Vite's file watcher off anything git ignores: build output,
 * caches, worktrees, and whatever the developer's global excludes file
 * lists. Vite's chokidar watcher doesn't read `.gitignore` on its own, so
 * without this a build or a sibling worktree triggers reloads in a
 * running dev server.
 *
 * Rules are read once, when the config resolves. Throws outside a git
 * worktree.
 */
export const gitignore = (): Plugin => ({
  name: '@dev/vite-plugin-gitignore',

  async config(config) {
    const cwd = resolve(config.root ?? '');
    const [worktreeRoot, ig] = await Promise.all([
      queryWorktreeRoot(cwd),
      load(cwd),
    ]);

    // Every place Vite runs here (dev, tests, CI) is a git checkout, so
    // a miss means git is missing or misconfigured. Failing beats silently
    // watching build output.
    if (!worktreeRoot) {
      return this.error(
        `[vite-plugin-gitignore] not inside a git worktree: ${cwd}`,
      );
    }

    const ignored = (
      path: string,
      stats?: { isDirectory: () => boolean },
    ): boolean => {
      const rel = relative(worktreeRoot, path);

      // `ignore` only takes paths inside the worktree, and throws on
      // anything else (including the root itself, which is `''`).
      if (!rel || rel.startsWith('..') || isAbsolute(rel)) return false;

      // Directory-only rules (`foo/`) need the trailing slash to match.
      // Chokidar doesn't always pass `stats`; then those rules only catch
      // the directory's contents, not the directory itself.
      return ig.ignores(stats?.isDirectory() ? `${rel}/` : rel);
    };

    // Vite merges this with any user-supplied `ignored` list rather than
    // replacing it, so its own defaults (`.git`, `node_modules`) stay.
    return { server: { watch: { ignored: [ignored] } } };
  },
});
