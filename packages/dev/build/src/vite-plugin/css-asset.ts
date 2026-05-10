import { createHash } from 'node:crypto';
import type { Plugin, ViteDevServer } from 'vite';

const QUERY = '?css-asset';
const VIRTUAL_PREFIX = '\0css-asset:';
// Trailing `.url` keeps the virtual id from matching VE's
// `cssFileFilter` (`\.css\.(js|ts|...)$`), which would otherwise
// pull our id into VE's transform and try to read it from disk.
const VIRTUAL_SUFFIX = '.url';
const PLACEHOLDER_PREFIX = '__CSS_ASSET_URL_';
const PLACEHOLDER_SUFFIX = '__';
const DEV_URL_PREFIX = '/@css-asset/';
const DEV_URL_SUFFIX = '.css';
const VANILLA_VIRTUAL_EXT = '.vanilla.css';

/**
 * Bridge a `.css.ts` (or any module that contributes CSS through
 * vanilla-extract) to a URL pointing at a self-contained CSS bundle:
 *
 *     import url from './blue.css.ts?css-asset';
 *
 * The bundle includes every transitive `.css.ts` dep, so a theme
 * `.css.ts` that assigns palette vars to contract slots ships
 * alongside the palette files that *define* those vars — the
 * resulting CSS is renderable in isolation behind a `<link>`.
 *
 * Build path: `load` lazily registers the entry as a Rollup chunk
 * via `this.emitFile({ type: 'chunk', id })` on the client
 * environment. Vite's CSS code splitter pulls each transitive
 * `.css.ts`/`.vanilla.css` payload onto a chunk's CSS sibling, but
 * Rollup may split shared deps (e.g. a tinted gray palette imported
 * by several themes) into their own JS chunks with their own CSS
 * siblings. `generateBundle` walks the entry chunk's transitive
 * `imports` graph, concatenates every reachable CSS sibling into
 * the entry's own CSS asset, rewrites the consumer's placeholder
 * to that URL, and drops the JS sibling — we only ever wanted the
 * CSS. The SSR build sees the same import (e.g. via `solid-meta`)
 * and emits the same placeholder; SolidStart builds client first,
 * so the URL captured during the client's `generateBundle` is in
 * scope by the time SSR's runs.
 *
 * Dev path: `load` returns a stable URL under `/@css-asset/` keyed
 * by a hash of the entry path. A middleware walks the dev module
 * graph, pulls each transitive `.vanilla.css` virtual through
 * Vite's `?direct` pipeline (raw CSS, no JS injector), and serves
 * the concatenation.
 */
export const cssAsset = (): Plugin => {
  let server: ViteDevServer | undefined;
  let base = '/';

  // Dev: stable key → resolved entry path.
  const devEntries = new Map<string, string>();
  // Build (client only): refId of the emitted chunk → stable key.
  const refIdToKey = new Map<string, string>();
  // Build (both envs): stable key → resolved CSS asset URL.
  const buildUrls = new Map<string, string>();
  // Dev: which `.css.ts` source files contribute to a served bundle.
  // Used to scope HMR full-reloads.
  const trackedSources = new Set<string>();

  const stableKey = (entryId: string): string =>
    createHash('sha1').update(entryId).digest('hex').slice(0, 12);

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
    name: '@dev/build:css-asset',
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
        const entryId = devEntries.get(key);
        if (!entryId) {
          res.statusCode = 404;
          res.end();
          return;
        }

        bundleForDev(devServer, entryId).then(
          ({ css, sources }) => {
            for (const source of sources) trackedSources.add(source);
            res.setHeader('Content-Type', 'text/css');
            // The link href is stable across rebuilds, so opt out of
            // caching to ensure a full reload always refetches the
            // freshly-bundled CSS.
            res.setHeader('Cache-Control', 'no-store');
            res.end(css);
          },
          (err: unknown) => next(err),
        );
      });
    },

    handleHotUpdate(ctx) {
      if (!ctx.file.endsWith('.css.ts')) return;
      if (!trackedSources.has(ctx.file)) return;
      // The bundled CSS enters the page via an SSR-emitted `<link>`,
      // so VE's per-module HMR can't reach its styles. Reload so the
      // browser refetches the freshly-bundled CSS.
      ctx.server.ws.send({ type: 'full-reload' });
    },

    async resolveId(source, importer) {
      if (!source.endsWith(`.css.ts${QUERY}`)) return undefined;
      const bare = source.slice(0, -QUERY.length);
      const resolved = await this.resolve(bare, importer, { skipSelf: true });
      if (!resolved) return undefined;
      return `${VIRTUAL_PREFIX}${resolved.id}${VIRTUAL_SUFFIX}`;
    },

    load(id) {
      if (!id.startsWith(VIRTUAL_PREFIX) || !id.endsWith(VIRTUAL_SUFFIX)) {
        return undefined;
      }
      const entryId = id.slice(VIRTUAL_PREFIX.length, -VIRTUAL_SUFFIX.length);
      const key = stableKey(entryId);

      if (server) {
        devEntries.set(key, entryId);
        return `export default ${JSON.stringify(`${DEV_URL_PREFIX}${key}${DEV_URL_SUFFIX}`)};`;
      }

      // Client emits the chunk; SSR doesn't need to (it would just
      // be tossed by `ssrEmitAssets: false`). Both envs return the
      // same placeholder string, which `generateBundle` rewrites
      // using URLs captured during the client build.
      if (!this.environment.config.build.ssr) {
        const refId = this.emitFile({
          type: 'chunk',
          id: entryId,
          // We never read JS exports; let Rollup tree-shake whatever
          // it can. The point of the chunk is its CSS sibling.
          preserveSignature: false,
        });
        refIdToKey.set(refId, key);
      }

      return `export default ${JSON.stringify(`${PLACEHOLDER_PREFIX}${key}${PLACEHOLDER_SUFFIX}`)};`;
    },

    generateBundle: {
      // Capture URLs and drop chunks before later plugins (manifest,
      // analyzers) observe the bundle.
      order: 'pre',
      handler(_outputOptions, bundle) {
        const isClient = !this.environment.config.build.ssr;

        if (isClient) {
          // Rollup splits shared `.css.ts` deps (e.g. a tinted gray
          // palette used by several themes) into their own JS chunks,
          // each with a CSS sibling. The entry chunk's `importedCss`
          // lists only its own sibling, so walk the JS import graph
          // to collect every transitive CSS file and inline them into
          // the primary CSS so the `<link>` resolves a self-contained
          // bundle.
          const collectTransitiveCss = (entryJs: string): string[] => {
            const visitedChunks = new Set<string>();
            const cssFiles: string[] = [];
            const queue = [entryJs];
            while (queue.length > 0) {
              const file = queue.shift();
              if (!file || visitedChunks.has(file)) continue;
              visitedChunks.add(file);
              const cur = bundle[file];
              if (!cur || cur.type !== 'chunk') continue;
              for (const css of cur.viteMetadata?.importedCss ?? []) {
                if (!cssFiles.includes(css)) cssFiles.push(css);
              }
              for (const imp of cur.imports) queue.push(imp);
            }
            return cssFiles;
          };

          for (const [refId, key] of refIdToKey) {
            const jsFile = this.getFileName(refId);
            const chunk = bundle[jsFile];
            if (!chunk || chunk.type !== 'chunk') continue;

            const cssFiles = collectTransitiveCss(jsFile);
            const [primary, ...rest] = cssFiles;
            if (primary) {
              const primaryAsset = bundle[primary];
              if (primaryAsset && primaryAsset.type === 'asset') {
                const parts: string[] = [readAssetSource(primaryAsset)];
                for (const dep of rest) {
                  const depAsset = bundle[dep];
                  if (depAsset && depAsset.type === 'asset') {
                    parts.push(readAssetSource(depAsset));
                  }
                }
                primaryAsset.source = parts.join('');
              }
              buildUrls.set(key, `${base}${primary}`);
            }

            delete bundle[jsFile];
          }
        }

        // Both environments rewrite the placeholders so the SSR and
        // client bundles agree on the URL strings.
        for (const fileName of Object.keys(bundle)) {
          const chunk = bundle[fileName];
          if (!chunk || chunk.type !== 'chunk') continue;
          chunk.code = replacePlaceholders(chunk.code);
        }
      },
    },
  };
};

const readAssetSource = (asset: { source: string | Uint8Array }): string =>
  typeof asset.source === 'string'
    ? asset.source
    : Buffer.from(asset.source).toString('utf8');

const bundleForDev = async (
  server: ViteDevServer,
  entryId: string,
): Promise<{ css: string; sources: string[] }> => {
  const cssFiles = await collectCssFilesViaGraph(server, entryId);

  const chunks: string[] = [];
  const sources: string[] = [];
  for (const cssFile of cssFiles) {
    const result = await server.transformRequest(`${cssFile}?direct`);
    if (!result?.code) continue;
    chunks.push(result.code);
    sources.push(cssFile.slice(0, -VANILLA_VIRTUAL_EXT.length));
  }

  return { css: chunks.join('\n'), sources };
};

const collectCssFilesViaGraph = async (
  server: ViteDevServer,
  entryId: string,
): Promise<string[]> => {
  const seen = new Set<string>();
  const order: string[] = [];

  const walk = async (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);

    // Triggers VE's transform if it hasn't run yet, registering the
    // `.vanilla.css` virtual and the module's `importedModules`
    // edges. The plugin-context `this.load` skips user transforms
    // in dev, so we go through the dev server.
    await server.transformRequest(id);
    const mod = server.moduleGraph.getModuleById(id);
    if (!mod) return;

    for (const imp of mod.importedModules) {
      if (imp.id) await walk(imp.id);
    }

    if (id.endsWith(VANILLA_VIRTUAL_EXT)) order.push(id);
  };

  await walk(entryId);
  return order;
};
