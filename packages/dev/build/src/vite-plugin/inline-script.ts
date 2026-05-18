import { build, type BuildResult } from 'esbuild';
import type { Plugin } from 'vite';

interface InlineScriptOptions {
  /**
   * Virtual module id consumers import. The default export is the
   * compiled IIFE as a string, ready to drop into `<script>{…}</script>`.
   */
  id: string;

  /**
   * Absolute path to the TS entry point that compiles into the inline
   * script. Must be self-contained — bundled by esbuild outside Vite's
   * plugin chain, so it can't use Vite-only imports (`virtual:*`,
   * `?url`, `*.css`, etc).
   */
  entry: string;

  /**
   * esbuild `target` for the compiled output. Defaults to a broad
   * baseline; tighten if you know the consumer only ships to modern
   * browsers.
   */
  target?: string | string[];
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

  const compile = async () => {
    const result: BuildResult = await build({
      entryPoints: [options.entry],
      bundle: true,
      minify: true,
      format: 'iife',
      platform: 'browser',
      target: options.target ?? 'es2020',
      write: false,
      metafile: true,
    });

    const code = result.outputFiles?.[0]?.text ?? '';
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
