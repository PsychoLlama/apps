import { readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';
import type { ImageResource, WebAppManifest } from 'web-app-manifest';
import { rasterizeSvg } from './resvg.ts';

const VIRTUAL_ID = 'virtual:pwa-manifest';
const RESOLVED_ID = '\0virtual:pwa-manifest';
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

/**
 * Stable manifest URL — constant in dev and builds alike. Installed
 * PWAs persist the manifest URL at install time and re-fetch *that*
 * URL on their own schedule; they never re-read the `<link>` from
 * fresh HTML. A content-addressed URL would therefore strand every
 * install on a hash that the next deploy deletes (→ 404). The stable
 * path lets re-fetches land a fresh manifest, and inherits the
 * default `max-age=0, must-revalidate` rule (it lives outside
 * `_build/`), so updates actually propagate. See `_redirects` for the
 * 301 that rescues installs still pinned to the old hashed path.
 */
const manifestPath = '/manifest.webmanifest';
const devIconPath = (variant: Variant, size: number): string =>
  `/${variant.stem}-${size}.png`;

/**
 * Emits a PWA web app manifest plus its raster icons. Importing
 * `virtual:pwa-manifest` returns the manifest's URL — the stable
 * `manifestPath` in every environment.
 *
 * Build: icons emit via `name` so Rollup hashes them through
 * `assetFileNames` (they stay immutable — only the manifest's *own*
 * URL must be stable, since that's the one browsers persist). The
 * manifest JSON captures their final hashed paths via
 * `this.getFileName`, then emits via `fileName` (verbatim, unhashed)
 * so it lands at the root `manifestPath` rather than under the
 * `immutable` `/_build/` prefix.
 *
 * Dev: a middleware rasterizes on demand and serves the manifest +
 * icons with `Cache-Control: no-store` so edits to the SVG surface
 * after a reload. The virtual module resolves to the same stable
 * path.
 */
export const pwaManifest = (config: PwaManifestConfig): Plugin => {
  let base = '/';
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

  return {
    name: '@dev/build:pwa-manifest',
    enforce: 'pre',

    configResolved(resolved) {
      base = resolved.base;
    },

    configureServer(devServer) {
      devServer.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?', 1)[0];

        if (path === manifestPath) {
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

      // Same stable URL in dev and builds — see `manifestPath`.
      return `export default ${JSON.stringify(manifestPath)};`;
    },

    async generateBundle() {
      // Only the client build ships browser assets; the SSR pass has
      // nothing to emit.
      if (this.environment.config.build.ssr) return;

      const refIds = new Map<string, string>();
      const refKey = (variant: Variant, size: number): string =>
        `${variant.stem}@${size}`;

      for (const variant of variants) {
        const svg = await readFile(variant.src, 'utf8');
        for (const size of config.icon.sizes) {
          const png = await rasterizeSvg(svg, size);
          const refId = this.emitFile({
            type: 'asset',
            // `name` (not `fileName`) routes through `assetFileNames`
            // so icons pick up a content hash and inherit the
            // `_build/*` long-cache rule. Icons stay immutable — the
            // manifest references their current hashed paths, so an
            // icon change still reaches installs through the mutable
            // manifest.
            name: `${variant.stem}-${size}.png`,
            source: Buffer.from(png),
          });
          refIds.set(refKey(variant, size), refId);
        }
      }

      this.emitFile({
        type: 'asset',
        // `fileName` (not `name`) writes the manifest verbatim at the
        // root `manifestPath`, off the `immutable` `/_build/` prefix,
        // so re-fetches revalidate and pick up content changes.
        fileName: MANIFEST_NAME,
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
    },
  };
};
