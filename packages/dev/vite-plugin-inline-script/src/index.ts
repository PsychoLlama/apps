import { build, type BuildResult } from 'esbuild';
import type { Plugin, ResolvedConfig } from 'vite';

// `?inline-script`, in the style of Vite's `?raw` / `?url`: the import
// site names the entry, so the module that renders the `<script>` owns
// its source and apps don't wire up one plugin instance per script.
const QUERY = '?inline-script';
const VIRTUAL_PREFIX = '\0inline-script:';

export interface InlineScriptOptions {
  /**
   * esbuild `target` for the compiled output. When omitted, inherits
   * Vite's resolved `build.target` so the inlined script transpiles
   * to the same baseline as the rest of the bundle.
   */
  target?: string | string[];

  /**
   * Hard ceiling on each compiled IIFE's byte length. The output is
   * inlined render-blocking in `<head>`, so silent bloat (e.g. an
   * import that drags in a CSS-in-JS runtime) is a regression worth
   * failing the build for. Omit to disable the check.
   */
  maxBytes?: number;
}

interface Compiled {
  code: string;
  inputs: ReadonlySet<string>;
}

/**
 * Compile `./entry.ts?inline-script` imports to an inlinable IIFE
 * string: the default export is ready to drop into
 * `<script>{…}</script>`. esbuild bundles and minifies the entry, the
 * result is cached for the build/dev session, and HMR invalidates on
 * any file in the compiled graph.
 *
 * Designed for head-script preludes that must run before paint and
 * need to import shared constants without a separate HTTP fetch —
 * inlining keeps the typing story intact and avoids a render-blocking
 * round trip.
 *
 * The entry is bundled outside Vite's plugin chain, so it must be
 * self-contained: no Vite-only imports (`virtual:*`, `?url`, `*.css`,
 * etc).
 */
export const inlineScript = (options: InlineScriptOptions = {}): Plugin => {
  const cache = new Map<string, Compiled>();
  let viteTarget: ResolvedConfig['build']['target'] | undefined;

  const compile = async (entry: string): Promise<Compiled> => {
    // Vite resolves `'baseline-widely-available'` and friends into
    // explicit browser strings before `configResolved` fires, so we
    // can hand the value straight to esbuild. `false` means "no
    // transpile" — drop the option entirely in that case.
    const inheritedTarget = viteTarget === false ? undefined : viteTarget;
    const target = options.target ?? inheritedTarget ?? 'es2020';

    const result: BuildResult = await build({
      entryPoints: [entry],
      bundle: true,
      minify: true,
      format: 'iife',
      platform: 'browser',
      target,
      write: false,
      metafile: true,
    });

    const outputs = result.outputFiles ?? [];
    const [head] = outputs;
    if (!head || outputs.length !== 1) {
      // iife format + no `splitting` should always collapse to one
      // file. Anything else (a worker import, an emitted asset) would
      // be silently dropped here and produce a broken inlined script.
      const paths = outputs.map((file) => file.path).join(', ');
      throw new Error(
        `[inline-script] expected exactly one output file, got ${outputs.length}: ${paths}`,
      );
    }

    const code = head.text;
    if (options.maxBytes !== undefined && code.length > options.maxBytes) {
      const inputs = Object.entries(result.metafile?.inputs ?? {})
        .map(([path, info]) => ({ path, bytes: info.bytes }))
        .sort((left, right) => right.bytes - left.bytes)
        .slice(0, 5)
        .map(({ path, bytes }) => `  ${bytes}B  ${path}`)
        .join('\n');

      throw new Error(
        `[inline-script] ${entry} compiled to ${code.length}B, exceeds limit of ${options.maxBytes}B. Largest inputs:\n${inputs}`,
      );
    }

    const inputs = new Set(
      Object.keys(result.metafile?.inputs ?? {}).map(
        (path) =>
          // esbuild metafile paths are relative to cwd; Vite's watcher
          // and module graph speak absolute paths. Resolve once here so
          // `handleHotUpdate` can match `ctx.file` directly.
          new URL(path, `file://${process.cwd()}/`).pathname,
      ),
    );

    return { code, inputs };
  };

  return {
    name: '@dev/vite-plugin-inline-script',
    enforce: 'pre',

    configResolved(config) {
      viteTarget = config.build.target;
    },

    async resolveId(source, importer) {
      if (!source.endsWith(QUERY)) return undefined;

      // Delegate path resolution to Vite so relative paths, aliases and
      // package exports behave the same as for any other import.
      const resolved = await this.resolve(
        source.slice(0, -QUERY.length),
        importer,
        { skipSelf: true },
      );

      if (!resolved) return undefined;
      return `${VIRTUAL_PREFIX}${resolved.id}`;
    },

    async load(id) {
      if (!id.startsWith(VIRTUAL_PREFIX)) return undefined;

      let compiled = cache.get(id);
      if (!compiled) {
        compiled = await compile(id.slice(VIRTUAL_PREFIX.length));
        cache.set(id, compiled);
      }

      for (const input of compiled.inputs) this.addWatchFile(input);

      return `export default ${JSON.stringify(compiled.code)};`;
    },

    handleHotUpdate(ctx) {
      const stale = [];
      for (const [id, compiled] of cache) {
        if (!compiled.inputs.has(ctx.file)) continue;
        cache.delete(id);
        const mod = ctx.server.moduleGraph.getModuleById(id);
        if (mod) stale.push(mod);
      }

      // Keep the file's own importers in the update: the prelude's
      // inputs (e.g. shared constants) are often app modules too.
      return stale.length > 0 ? [...ctx.modules, ...stale] : undefined;
    },
  };
};
