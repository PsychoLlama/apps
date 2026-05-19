import { readFile } from 'node:fs/promises';
import type { Plugin, ViteDevServer } from 'vite';
import type { ImageResource, WebAppManifest } from 'web-app-manifest';
import { rasterizeSvg } from './resvg.ts';

const VIRTUAL_ID = 'virtual:pwa-manifest';
const RESOLVED_ID = '\0virtual:pwa-manifest';
const PLACEHOLDER = '__PWA_MANIFEST_URL__';
const MANIFEST_NAME = 'manifest.webmanifest';

interface IconConfig {
  /** Absolute path to the source SVG. */
  src: string;
  /** Square pixel sizes to rasterize. */
  sizes: number[];
  /**
   * Optional companion SVG designed for Android adaptive-icon
   * masking. Rasterized into the same sizes as `src` and emitted as
   * a `purpose: "maskable"` entry alongside the default icons.
   *
   * Maskable icons need a full-bleed background and the visible
   * content inset into the spec's safe zone (80% of the inscribed
   * circle) — the launcher applies an OEM-defined shape mask that
   * can clip a normal icon's edges.
   */
  maskable?: string;
}

interface PwaManifestConfig {
  icon: IconConfig;
  /**
   * Manifest fields. `icons` is synthesized from `icon.sizes` and
   * merged in last, so it can't be overridden here.
   */
  manifest: Omit<WebAppManifest, 'icons'>;
}

interface Variant {
  /** Manifest `purpose` value. Omitted from output for `'any'`. */
  purpose: 'any' | 'maskable';
  /** Absolute path to the source SVG. */
  src: string;
  /** Stem used for dev paths and emitted asset names. */
  stem: string;
}

const collectVariants = (icon: IconConfig): Variant[] => {
  const variants: Variant[] = [{ purpose: 'any', src: icon.src, stem: 'icon' }];

  if (icon.maskable !== undefined) {
    variants.push({
      purpose: 'maskable',
      src: icon.maskable,
      stem: 'icon-maskable',
    });
  }

  return variants;
};

/** Stable path served by the dev middleware. Hashed in builds. */
const devManifestPath = '/manifest.webmanifest';
const devIconPath = (variant: Variant, size: number): string =>
  `/${variant.stem}-${size}.png`;

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
  const variants = collectVariants(config.icon);

  const buildIconList = (
    iconUrl: (variant: Variant, size: number) => string,
  ): ImageResource[] =>
    variants.flatMap((variant) =>
      config.icon.sizes.map<ImageResource>((size) => ({
        src: iconUrl(variant, size),
        sizes: `${size}x${size}`,
        type: 'image/png',
        // Omit `purpose` on the default variant — the spec treats
        // its absence as `"any"`, so adding it just bloats the JSON.
        ...(variant.purpose === 'maskable' && { purpose: 'maskable' }),
      })),
    );

  const buildManifestJson = (
    iconUrl: (variant: Variant, size: number) => string,
  ): string =>
    JSON.stringify({
      ...config.manifest,
      icons: buildIconList(iconUrl),
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

        for (const variant of variants) {
          for (const size of config.icon.sizes) {
            if (path !== devIconPath(variant, size)) continue;
            readFile(variant.src, 'utf8')
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
        }

        next();
      });
    },

    handleHotUpdate(ctx) {
      if (!variants.some((variant) => variant.src === ctx.file)) return;
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
      for (const variant of variants) this.addWatchFile(variant.src);

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
          const refIds = new Map<string, string>();
          const refKey = (variant: Variant, size: number): string =>
            `${variant.stem}@${size}`;

          for (const variant of variants) {
            const svg = await readFile(variant.src, 'utf8');
            for (const size of config.icon.sizes) {
              const png = await rasterizeSvg(svg, size);
              const refId = this.emitFile({
                type: 'asset',
                // `name` (not `fileName`) routes through
                // `assetFileNames` so the path picks up a content
                // hash and inherits the `_build/*` long-cache rule.
                name: `${variant.stem}-${size}.png`,
                source: Buffer.from(png),
              });
              refIds.set(refKey(variant, size), refId);
            }
          }

          const manifestRefId = this.emitFile({
            type: 'asset',
            name: MANIFEST_NAME,
            source: buildManifestJson((variant, size) => {
              const refId = refIds.get(refKey(variant, size));
              if (refId === undefined) {
                throw new Error(
                  `Missing emitted icon for ${variant.stem} @ ${size}`,
                );
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
