import { readFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import type { Plugin } from 'vite';

// Assembled at runtime so this source file itself doesn't contain
// the literal marker substring. Otherwise, the plugin would rewrite
// its own constant when transforming its source — under bundlers
// that pipe the plugin through the same transform chain (vitest in
// our case) — turning `MARKER` into an array and breaking every
// downstream `code.includes(MARKER)` check.
const MARKER = ['import', 'meta', 'INSTRUMENTATION_SCOPE'].join('.');

interface PackageInfo {
  name: string;
  srcDir: string;
}

/**
 * Replace `import.meta.INSTRUMENTATION_SCOPE` with a literal
 * `[packageName, ...modulePath]` array, where `modulePath` is the
 * extensionless path of the importing file relative to its package's
 * `src/` directory, split into one segment per array entry. Shape
 * matches otel's instrumentation-scope identity.
 *
 * Example: `packages/app/main/src/entry-client.tsx`
 * → `['@app/main', 'entry-client']`.
 */
export const instrumentationScope = (): Plugin => {
  // dir → in-flight or settled promise resolving to the nearest
  // package.json info, or null if no ancestor has one. Stored as
  // promises so concurrent transforms walking the same ancestry
  // share a single filesystem probe per directory.
  //
  // Never invalidated: package.json renames during a session are
  // vanishingly rare and would warrant a server restart anyway.
  const packageCache = new Map<string, Promise<PackageInfo | null>>();

  const readPackageName = async (dir: string): Promise<string | null> => {
    let raw: string;
    try {
      raw = await readFile(join(dir, 'package.json'), 'utf8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
    const pkg: unknown = JSON.parse(raw);
    if (
      pkg &&
      typeof pkg === 'object' &&
      'name' in pkg &&
      typeof pkg.name === 'string'
    ) {
      return pkg.name;
    }
    return null;
  };

  const walkUp = async (dir: string): Promise<PackageInfo | null> => {
    const name = await readPackageName(dir);
    if (name !== null) return { name, srcDir: join(dir, 'src') };

    const parent = dirname(dir);
    if (parent === dir) return null;

    return resolvePackage(parent);
  };

  const resolvePackage = (dir: string): Promise<PackageInfo | null> => {
    const cached = packageCache.get(dir);
    if (cached) return cached;
    const pending = walkUp(dir);
    packageCache.set(dir, pending);
    return pending;
  };

  // Strip the final extension only; preserves dotted basenames
  // like `create-logger.test`.
  const stripExt = (path: string): string => {
    const lastDot = path.lastIndexOf('.');
    const lastSlash = path.lastIndexOf('/');
    return lastDot > lastSlash ? path.slice(0, lastDot) : path;
  };

  return {
    name: '@dev/build:instrumentation-scope',
    enforce: 'pre',

    async transform(code, id) {
      if (!code.includes(MARKER)) return undefined;

      // Virtual modules (rollup convention) don't map to disk.
      if (id.startsWith('\0')) return undefined;

      // Vite appends `?query` and `#hash` to ids; strip for fs lookup.
      const file = id.split('?')[0].split('#')[0];

      const pkg = await resolvePackage(dirname(file));
      if (!pkg) {
        this.error(
          `${MARKER} used in ${id}, but no package.json was found above it.`,
        );
      }

      const rel = relative(pkg.srcDir, file);
      if (rel.startsWith('..') || rel.startsWith(sep) || rel === '') {
        this.error(
          `${MARKER} used in ${id}, which is not under ${pkg.srcDir}.`,
        );
      }

      const segments = stripExt(rel.split(sep).join('/')).split('/');
      const literal = JSON.stringify([pkg.name, ...segments]);
      return { code: code.replaceAll(MARKER, literal), map: null };
    },
  };
};
