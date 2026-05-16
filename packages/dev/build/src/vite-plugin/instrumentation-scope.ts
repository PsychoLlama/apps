import { existsSync, readFileSync } from 'node:fs';
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
  // dir → nearest package.json info, or null if the dir is outside
  // any package. Cached across transforms; never invalidated because
  // package.json renames during a single dev session are vanishingly
  // rare and would warrant a server restart anyway.
  const packageCache = new Map<string, PackageInfo | null>();

  const resolvePackage = (file: string): PackageInfo | null => {
    const visited: string[] = [];
    let dir = dirname(file);

    while (true) {
      const cached = packageCache.get(dir);
      if (cached !== undefined) {
        for (const seen of visited) packageCache.set(seen, cached);
        return cached;
      }
      visited.push(dir);

      const pkgPath = join(dir, 'package.json');
      if (existsSync(pkgPath)) {
        const pkg: unknown = JSON.parse(readFileSync(pkgPath, 'utf8'));
        if (
          pkg &&
          typeof pkg === 'object' &&
          'name' in pkg &&
          typeof pkg.name === 'string'
        ) {
          const info: PackageInfo = {
            name: pkg.name,
            srcDir: join(dir, 'src'),
          };
          for (const seen of visited) packageCache.set(seen, info);
          return info;
        }
      }

      const parent = dirname(dir);
      if (parent === dir) {
        for (const seen of visited) packageCache.set(seen, null);
        return null;
      }
      dir = parent;
    }
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

    transform(code, id) {
      if (!code.includes(MARKER)) return undefined;

      // Virtual modules (rollup convention) don't map to disk.
      if (id.startsWith('\0')) return undefined;

      // Vite appends `?query` and `#hash` to ids; strip for fs lookup.
      const file = id.split('?')[0].split('#')[0];

      const pkg = resolvePackage(file);
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
