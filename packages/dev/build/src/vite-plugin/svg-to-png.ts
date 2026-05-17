import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import type { Plugin, ViteDevServer } from 'vite';

// `?to-png=<size>`. Plain `?png` was too generic; the verb-y form
// reads as "import as png at <size>" and matches Vite's `?url` /
// `?raw` style. TypeScript's wildcard module declarations only
// allow a single `*` per pattern, so the import-shape `.d.ts` still
// has one entry per size — but the URL itself uses the standard
// key=value query that Vite, browsers, and `URLSearchParams` agree
// on.
const QUERY_PREFIX = '?to-png=';
const VIRTUAL_PREFIX = '\0svg-to-png:';
const VIRTUAL_SUFFIX = '.url';
const PLACEHOLDER_PREFIX = '__SVG_TO_PNG_URL_';
const PLACEHOLDER_SUFFIX = '__';
const DEV_URL_PREFIX = '/@svg-to-png/';
const DEV_URL_SUFFIX = '.png';

interface DevEntry {
  svgPath: string;
  size: number;
}

const WASM_PATH = fileURLToPath(
  // The package's `./index_bg.wasm` export resolves to the wasm
  // sibling regardless of where pnpm hoists the package.
  import.meta.resolve('@resvg/resvg-wasm/index_bg.wasm'),
);

let wasmReady: Promise<void> | undefined;
const ensureWasm = async (): Promise<void> => {
  // `initWasm` is idempotent across the process — guard with a
  // module-level promise so concurrent renders share one init.
  wasmReady ??= readFile(WASM_PATH).then(initWasm);

  return wasmReady;
};

const rasterize = async (svg: string, size: number): Promise<Uint8Array> => {
  await ensureWasm();
  const renderer = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    // The brandmark is a flat geometric shape — no fonts to embed,
    // no need to slow down rendering on text quality knobs.
    font: { loadSystemFonts: false },
  });
  return renderer.render().asPng();
};

const stableKey = (input: string): string =>
  createHash('sha1').update(input).digest('hex').slice(0, 12);

interface SvgToPngMatch {
  /** The import path with the `?to-png=…` query stripped. */
  bare: string;
  size: number;
}

const parseImport = (source: string): SvgToPngMatch | undefined => {
  const queryStart = source.indexOf(QUERY_PREFIX);
  if (queryStart === -1) return undefined;
  const bare = source.slice(0, queryStart);
  if (!bare.endsWith('.svg')) return undefined;

  const sizeStr = source.slice(queryStart + QUERY_PREFIX.length);
  const size = Number.parseInt(sizeStr, 10);
  if (!Number.isFinite(size) || size <= 0) return undefined;
  // Reject trailing garbage after the integer (e.g. `?to-png=180x`)
  // so callers can't smuggle extra query params through.
  if (String(size) !== sizeStr) return undefined;

  return { bare, size };
};

/**
 * Build-time SVG-to-PNG rasterizer. Importing
 * `./icon.svg?to-png=180` returns a URL pointing at a hashed PNG
 * asset rendered from the SVG at the requested square size.
 *
 * Dev path: a middleware under `/@svg-to-png/<key>.png` rasterizes
 * on demand. The URL is stable across edits to the underlying SVG;
 * `Cache-Control: no-store` keeps a re-render visible after a full
 * reload.
 *
 * Build path: `load` rasterizes once during the client environment's
 * pass and emits the PNG via `this.emitFile`. SSR sees a placeholder
 * that `generateBundle` rewrites with the URL captured by the client.
 */
export const svgToPng = (): Plugin => {
  let server: ViteDevServer | undefined;
  let base = '/';

  const devEntries = new Map<string, DevEntry>();
  const refIdToKey = new Map<string, string>();
  const buildUrls = new Map<string, string>();

  const replacePlaceholders = (code: string): string => {
    if (!code.includes(PLACEHOLDER_PREFIX)) return code;
    let result = code;
    for (const [key, url] of buildUrls) {
      result = result.replaceAll(
        `${PLACEHOLDER_PREFIX}${key}${PLACEHOLDER_SUFFIX}`,
        url,
      );
    }
    return result;
  };

  return {
    name: '@dev/build:svg-to-png',
    enforce: 'pre',

    configResolved(config) {
      base = config.base;
    },

    configureServer(devServer) {
      server = devServer;

      devServer.middlewares.use((req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith(DEV_URL_PREFIX)) {
          next();
          return;
        }

        const tail = url.slice(DEV_URL_PREFIX.length).split('?', 1)[0];
        const key = tail.endsWith(DEV_URL_SUFFIX)
          ? tail.slice(0, -DEV_URL_SUFFIX.length)
          : tail;
        const entry = devEntries.get(key);
        if (!entry) {
          res.statusCode = 404;
          res.end();
          return;
        }

        readFile(entry.svgPath, 'utf8')
          .then((svg) => rasterize(svg, entry.size))
          .then(
            (png) => {
              res.setHeader('Content-Type', 'image/png');
              res.setHeader('Cache-Control', 'no-store');
              res.end(Buffer.from(png));
            },
            (err: unknown) => next(err),
          );
      });
    },

    handleHotUpdate(ctx) {
      if (!ctx.file.endsWith('.svg')) return;
      let touched = false;
      for (const entry of devEntries.values()) {
        if (entry.svgPath === ctx.file) {
          touched = true;
          break;
        }
      }
      if (!touched) return;
      // PNGs are referenced from `<link>` tags in the prerendered
      // HTML. The browser won't re-fetch them on its own, so trigger
      // a full reload after the SVG changes.
      ctx.server.ws.send({ type: 'full-reload' });
    },

    async resolveId(source, importer) {
      const match = parseImport(source);
      if (!match) return undefined;
      // Delegate path resolution to Vite so workspace-relative
      // paths, aliases, and the configured `root` all behave the
      // same as for any other import. If Vite can't resolve the
      // bare SVG, the import is malformed — bail and let Rollup
      // surface the error.
      const resolved = await this.resolve(match.bare, importer, {
        skipSelf: true,
      });
      if (!resolved) return undefined;
      return `${VIRTUAL_PREFIX}${resolved.id}@${match.size}${VIRTUAL_SUFFIX}`;
    },

    async load(id) {
      if (!id.startsWith(VIRTUAL_PREFIX) || !id.endsWith(VIRTUAL_SUFFIX)) {
        return undefined;
      }
      const inner = id.slice(VIRTUAL_PREFIX.length, -VIRTUAL_SUFFIX.length);
      const at = inner.lastIndexOf('@');
      const svgPath = inner.slice(0, at);
      const size = Number.parseInt(inner.slice(at + 1), 10);
      const key = stableKey(`${svgPath}@${size}`);

      this.addWatchFile(svgPath);

      if (server) {
        devEntries.set(key, { svgPath, size });
        return `export default ${JSON.stringify(`${DEV_URL_PREFIX}${key}${DEV_URL_SUFFIX}`)};`;
      }

      // Only rasterize during the client environment's pass; SSR
      // shares the URL via a placeholder rewritten in
      // `generateBundle`.
      if (!this.environment.config.build.ssr) {
        const svg = await readFile(svgPath, 'utf8');
        const png = await rasterize(svg, size);
        const refId = this.emitFile({
          type: 'asset',
          name: `${path.basename(svgPath, '.svg')}-${size}.png`,
          source: Buffer.from(png),
        });
        refIdToKey.set(refId, key);
      }

      return `export default ${JSON.stringify(`${PLACEHOLDER_PREFIX}${key}${PLACEHOLDER_SUFFIX}`)};`;
    },

    generateBundle: {
      // Capture URLs and rewrite placeholders before later plugins
      // (manifest, analyzers) observe the bundle.
      order: 'pre',
      handler(_outputOptions, bundle) {
        const isClient = !this.environment.config.build.ssr;

        if (isClient) {
          for (const [refId, key] of refIdToKey) {
            // `getFileName` returns a path relative to the output
            // root; prefix with `base` so the URL works regardless
            // of which route the prerendered HTML lives at.
            buildUrls.set(key, `${base}${this.getFileName(refId)}`);
          }
        }

        for (const fileName of Object.keys(bundle)) {
          const chunk = bundle[fileName];
          if (!chunk || chunk.type !== 'chunk') continue;
          chunk.code = replacePlaceholders(chunk.code);
        }
      },
    },
  };
};
