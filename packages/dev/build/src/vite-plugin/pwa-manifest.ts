import { readFile } from 'node:fs/promises';
import type { Plugin, ViteDevServer } from 'vite';
import type { WebAppManifest } from 'web-app-manifest';
import { rasterizeSvg } from './resvg.ts';

const VIRTUAL_ID = 'virtual:pwa-manifest';
const RESOLVED_ID = '\0virtual:pwa-manifest';
const PLACEHOLDER = '__PWA_MANIFEST_URL__';
const MANIFEST_NAME = 'manifest.webmanifest';

/** Stable path served by the dev middleware. Hashed in builds. */
const devManifestPath = '/manifest.webmanifest';
const devIconPath = (size: number): string => `/icon-${size}.png`;

interface IconConfig {
  /** Absolute path to the source SVG. */
  src: string;
  /** Square pixel sizes to rasterize. */
  sizes: number[];
}

interface PwaManifestConfig {
  icon: IconConfig;
  /**
   * Manifest fields. `icons` is synthesized from `icon.sizes` and
   * merged in last, so it can't be overridden here.
   */
  manifest: Omit<WebAppManifest, 'icons'>;
}

/**
 * Emits a PWA web app manifest plus its raster icons as hashed
 * assets. Importing `virtual:pwa-manifest` returns the manifest's
 * final URL — mirrors the `?to-png=<size>` flow in `svg-to-png` so
 * the link-tag site stays declarative.
 *
 * Build: icons emit via `name` so Rollup hashes them through
 * `assetFileNames`; the manifest JSON captures their final paths
 * via `this.getFileName`, then itself emits under the same hashed
 * template. All artifacts land under `/_build/assets/` and inherit
 * the `immutable` long-cache rule from `_headers`. The SSR pass
 * sees a placeholder that gets rewritten with the URL captured by
 * the client pass — same closure-sharing trick as `svg-to-png`.
 *
 * Dev: a middleware rasterizes on demand and serves the manifest +
 * icons with `Cache-Control: no-store` so edits to the SVG surface
 * after a reload. The virtual module resolves to the stable dev
 * path.
 */
export const pwaManifest = (config: PwaManifestConfig): Plugin => {
  let server: ViteDevServer | undefined;
  let base = '/';
  let buildUrl: string | undefined;

  const buildManifestJson = (iconUrl: (size: number) => string): string =>
    JSON.stringify({
      ...config.manifest,
      icons: config.icon.sizes.map((size) => ({
        src: iconUrl(size),
        sizes: `${size}x${size}`,
        type: 'image/png',
      })),
    });

  const replacePlaceholders = (code: string): string => {
    if (!code.includes(PLACEHOLDER) || buildUrl === undefined) return code;
    return code.replaceAll(PLACEHOLDER, buildUrl);
  };

  return {
    name: '@dev/build:pwa-manifest',
    enforce: 'pre',

    configResolved(resolved) {
      base = resolved.base;
    },

    configureServer(devServer) {
      server = devServer;

      devServer.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?', 1)[0];

        if (path === devManifestPath) {
          res.setHeader('Content-Type', 'application/manifest+json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(buildManifestJson(devIconPath));
          return;
        }

        for (const size of config.icon.sizes) {
          if (path !== devIconPath(size)) continue;
          readFile(config.icon.src, 'utf8')
            .then((svg) => rasterizeSvg(svg, size))
            .then(
              (png) => {
                res.setHeader('Content-Type', 'image/png');
                res.setHeader('Cache-Control', 'no-store');
                res.end(Buffer.from(png));
              },
              (err: unknown) => next(err),
            );
          return;
        }

        next();
      });
    },

    handleHotUpdate(ctx) {
      if (ctx.file !== config.icon.src) return;
      // The manifest + icons are referenced from prerendered HTML.
      // A full reload re-pulls them so SVG edits become visible.
      ctx.server.ws.send({ type: 'full-reload' });
    },

    resolveId(source) {
      if (source === VIRTUAL_ID) return RESOLVED_ID;
      return undefined;
    },

    load(id) {
      if (id !== RESOLVED_ID) return undefined;
      this.addWatchFile(config.icon.src);

      if (server) {
        return `export default ${JSON.stringify(devManifestPath)};`;
      }

      return `export default ${JSON.stringify(PLACEHOLDER)};`;
    },

    generateBundle: {
      // Capture the manifest URL and rewrite placeholders before
      // later plugins (analyzers, hashed-asset guards) observe the
      // bundle.
      order: 'pre',
      async handler(_outputOptions, bundle) {
        const isClient = !this.environment.config.build.ssr;

        if (isClient) {
          const svg = await readFile(config.icon.src, 'utf8');
          const iconRefIds = new Map<number, string>();

          for (const size of config.icon.sizes) {
            const png = await rasterizeSvg(svg, size);
            const refId = this.emitFile({
              type: 'asset',
              // `name` (not `fileName`) routes through
              // `assetFileNames` so the path picks up a content
              // hash and inherits the `_build/*` long-cache rule.
              name: `icon-${size}.png`,
              source: Buffer.from(png),
            });
            iconRefIds.set(size, refId);
          }

          const manifestRefId = this.emitFile({
            type: 'asset',
            name: MANIFEST_NAME,
            source: buildManifestJson((size) => {
              const refId = iconRefIds.get(size);
              if (refId === undefined) {
                throw new Error(`Missing emitted icon for size ${size}`);
              }
              return `${base}${this.getFileName(refId)}`;
            }),
          });

          buildUrl = `${base}${this.getFileName(manifestRefId)}`;
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
