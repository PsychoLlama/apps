import { readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';
import { rasterizeSvg } from './resvg.ts';

interface IconConfig {
  /** Absolute path to the source SVG. */
  src: string;
  /** Square pixel sizes to rasterize. */
  sizes: number[];
}

interface PwaManifestConfig {
  /**
   * Manifest filename emitted at the output root. The browser fetches
   * it from `/<fileName>`. Defaults to `manifest.webmanifest`.
   */
  fileName?: string;
  icon: IconConfig;
  /**
   * Manifest fields. `icons` is synthesized from `icon.sizes` and
   * merged in last, so it can't be overridden here.
   */
  manifest: Record<string, unknown>;
}

/**
 * Emits a PWA web app manifest and its raster icons at stable paths.
 *
 * Build: the manifest and PNG icons land at the output root (e.g.
 * `/manifest.webmanifest`, `/icon-192.png`). Stable filenames are
 * required because the manifest references the icons by URL — the
 * hashed `_build/` paths used by JS-imported assets would force a
 * second indirection. The trade-off is that these files inherit
 * Cloudflare's default `must-revalidate` cache rather than the
 * `immutable` rule the `/_build/*` prefix gets.
 *
 * Dev: a middleware rasterizes on demand and serves the manifest +
 * icons with `no-store` so edits to the SVG appear after a reload.
 */
export const pwaManifest = (config: PwaManifestConfig): Plugin => {
  const manifestFileName = config.fileName ?? 'manifest.webmanifest';
  const iconFileName = (size: number): string => `icon-${size}.png`;

  const buildManifestJson = (): string =>
    JSON.stringify(
      {
        ...config.manifest,
        icons: config.icon.sizes.map((size) => ({
          src: `/${iconFileName(size)}`,
          sizes: `${size}x${size}`,
          type: 'image/png',
        })),
      },
      null,
      2,
    );

  return {
    name: '@dev/build:pwa-manifest',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?', 1)[0];

        if (path === `/${manifestFileName}`) {
          res.setHeader('Content-Type', 'application/manifest+json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(buildManifestJson());
          return;
        }

        for (const size of config.icon.sizes) {
          if (path !== `/${iconFileName(size)}`) continue;
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

    async generateBundle() {
      // Only emit during the client environment's pass. SSR shares
      // the same output tree but doesn't need a second copy.
      if (this.environment.config.build.ssr) return;

      const svg = await readFile(config.icon.src, 'utf8');

      for (const size of config.icon.sizes) {
        const png = await rasterizeSvg(svg, size);
        this.emitFile({
          type: 'asset',
          // `fileName` (not `name`) skips the hashed template and
          // pins the path so the manifest can reference it.
          fileName: iconFileName(size),
          source: Buffer.from(png),
        });
      }

      this.emitFile({
        type: 'asset',
        fileName: manifestFileName,
        source: buildManifestJson(),
      });
    },
  };
};
