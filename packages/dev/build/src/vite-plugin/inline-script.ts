import { build, type BuildResult } from 'esbuild';
import type { Plugin, ResolvedConfig } from 'vite';

interface InlineScriptOptions {
  /**
   * Virtual module id consumers import. The default export is the
   * compiled IIFE as a string, ready to drop into `<script>{…}</script>`.
   */
  id: string;

  /**
   * Absolute filesystem path to the TS entry point that compiles
   * into the inline script. Callers holding a `file://` URL from
   * `import.meta.resolve` should convert via `fileURLToPath` before
   * passing it in.
   *
   * Must be self-contained: bundled by esbuild outside Vite's plugin
   * chain, so it can't use Vite-only imports (`virtual:*`, `?url`,
   * `*.css`, etc).
   */
  entry: string;

  /**
   * esbuild `target` for the compiled output. When omitted, inherits
   * Vite's resolved `build.target` so the inlined script transpiles
   * to the same baseline as the rest of the bundle.
   */
  target?: string | string[];

  /**
   * Hard ceiling on the compiled IIFE's byte length. The output is
   * inlined render-blocking in `<head>`, so silent bloat (e.g. an
   * import that drags in a CSS-in-JS runtime) is a regression worth
   * failing the build for. Omit to disable the check.
   */
  maxBytes?: number;
}

/**
 * Expose a TypeScript file as an inlinable IIFE string via a virtual
 * module. Compiles the entry with esbuild (bundle + minify + iife) and
 * caches the result for the build/dev session; HMR invalidates on any
 * file in the compiled graph.
 *
 * Designed for head-script preludes that must run before paint and
 * need to import shared constants without a separate HTTP fetch —
 * inlining keeps the typing story intact and avoids a render-blocking
 * round trip.
 */
export const inlineScript = (options: InlineScriptOptions): Plugin => {
  const resolved = `\0${options.id}`;
  let cached: { code: string; inputs: ReadonlySet<string> } | null = null;
  let viteTarget: ResolvedConfig['build']['target'] | undefined;

  const compile = async () => {
    // Vite resolves `'baseline-widely-available'` and friends into
    // explicit browser strings before `configResolved` fires, so we
    // can hand the value straight to esbuild. `false` means "no
    // transpile" — drop the option entirely in that case.
    const inheritedTarget = viteTarget === false ? undefined : viteTarget;
    const target = options.target ?? inheritedTarget ?? 'es2020';

    const result: BuildResult = await build({
      entryPoints: [options.entry],
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
        `[inline-script:${options.id}] expected exactly one output file, got ${outputs.length}: ${paths}`,
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
        `[inline-script:${options.id}] compiled output is ${code.length}B, exceeds limit of ${options.maxBytes}B. Largest inputs:\n${inputs}`,
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
    name: '@dev/build:inline-script',

    configResolved(config) {
      viteTarget = config.build.target;
    },

    resolveId(id) {
      if (id === options.id) return resolved;
    },

    async load(id) {
      if (id !== resolved) return;

      cached ??= await compile();
      for (const input of cached.inputs) this.addWatchFile(input);

      return `export default ${JSON.stringify(cached.code)};`;
    },

    handleHotUpdate(ctx) {
      if (!cached?.inputs.has(ctx.file)) return;

      cached = null;
      const mod = ctx.server.moduleGraph.getModuleById(resolved);
      return mod ? [mod] : undefined;
    },
  };
};
