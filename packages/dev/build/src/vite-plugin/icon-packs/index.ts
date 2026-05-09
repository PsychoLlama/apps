import type { Plugin, ViteDevServer } from 'vite';
import {
  findIconifyJsonRoot,
  loadCollections,
  loadRawPack,
  type CollectionsJson,
  type RawPackJson,
} from './iconify.ts';
import { DEV_URL_PREFIX, createDevMiddleware } from './dev-server.ts';
import {
  buildPackData,
  pickSamples,
  type PackData,
  type PackInfo,
} from './pack-data.ts';
import {
  DEFAULT_PAGE_SIZE,
  pageStartOffsets,
  sliceIntoPages,
} from './pagination.ts';
import {
  INDEX_URL_PLACEHOLDER,
  REF_PLACEHOLDER_MARKER,
  createPlaceholderTable,
} from './placeholders.ts';
import { withOnlyAllowedPacks } from './allowed-packs.ts';
import { sortedPackIds } from './order.ts';

const VIRTUAL_ID = 'virtual:icon-packs';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

interface PluginOptions {
  /** Icons per page chunk. */
  pageSize?: number;
}

/**
 * Carry per-pack build outputs across the load → manifest emit
 * boundary. The manifest references each pack's pages by placeholder
 * (resolved later in `generateBundle`); the pack info populates the
 * top-level index.
 */
interface PackBuild {
  info: PackInfo;
  /** Manifest payload, with placeholders for each page asset's URL. */
  manifestSource: string;
}

/**
 * Build-time emitter for paginated icon-pack assets:
 *
 *     import indexUrl from 'virtual:icon-packs';
 *
 * Resolves to the URL of a hashed JSON index listing every pack
 * (id, name, sample previews, manifest URL). Each pack's manifest
 * lists the URLs of its page chunks; each page chunk is an array of
 * `{ name, body }` icon entries. The runtime fetches just what the
 * user is currently looking at.
 *
 * Build path: a single client-side `load` call processes every pack
 * from `@iconify/json`, emits manifests + page chunks via
 * `this.emitFile`, and embeds placeholders that `generateBundle`
 * rewrites with the hashed URLs Vite assigns. SSR shares the index
 * URL through the same placeholder pattern as `css-asset.ts`.
 *
 * Dev path: a `/@icon-packs/...` middleware lazily reads and slices
 * packs on demand. Stable URLs mean the runtime can hand out
 * predictable links without a build step.
 */
export const iconPacks = (options: PluginOptions = {}): Plugin => {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  let server: ViteDevServer | undefined;
  let base = '/';

  // Build-time state shared across environments. SolidStart builds
  // client first, so by the time SSR's `generateBundle` runs the
  // placeholder URLs are populated.
  let indexRefId: string | undefined;
  let capturedIndexUrl: string | undefined;
  const placeholders = createPlaceholderTable();

  // Dev cache: a pack's full processed data, keyed by id.
  const devPackCache = new Map<string, PackData>();
  let devCollectionsPromise: Promise<CollectionsJson> | undefined;

  const getCollections = async (): Promise<CollectionsJson> => {
    devCollectionsPromise ??= loadCollections(findIconifyJsonRoot()).then(
      withOnlyAllowedPacks,
    );
    return devCollectionsPromise;
  };

  const getPackData = async (id: string): Promise<PackData | undefined> => {
    const cached = devPackCache.get(id);
    if (cached) return cached;
    const collections = await getCollections();
    const meta = collections[id];
    if (!meta) return undefined;
    let raw: RawPackJson;
    try {
      raw = await loadRawPack(findIconifyJsonRoot(), id);
    } catch {
      return undefined;
    }
    const data = buildPackData(raw, id, meta);
    data.samples = pickSamples(data.icons, meta.samples);
    devPackCache.set(id, data);
    return data;
  };

  return {
    name: '@dev/build:icon-packs',
    enforce: 'pre',

    configResolved(config) {
      base = config.base;
    },

    configureServer(devServer) {
      server = devServer;
      devServer.middlewares.use(
        createDevMiddleware({ getCollections, getPackData, pageSize }),
      );
    },

    resolveId(source) {
      if (source === VIRTUAL_ID) return RESOLVED_ID;
      return undefined;
    },

    async load(id) {
      if (id !== RESOLVED_ID) return undefined;

      if (server) {
        return `export default ${JSON.stringify(`${DEV_URL_PREFIX}index.json`)};`;
      }

      // Only emit during the client environment's build. SSR shares
      // the URL via the placeholder rewritten in `generateBundle`.
      if (!this.environment.config.build.ssr && indexRefId === undefined) {
        const root = findIconifyJsonRoot();
        const collections = withOnlyAllowedPacks(await loadCollections(root));
        // Sort once up front; every downstream array
        // (manifestPlaceholders, indexPayload) inherits this order.
        const packIds = sortedPackIds(collections);

        const packBuilds: PackBuild[] = [];

        for (const packId of packIds) {
          const meta = collections[packId];
          let raw: RawPackJson;
          try {
            raw = await loadRawPack(root, packId);
          } catch {
            // Skip packs whose JSON is missing — `collections.json`
            // occasionally lists prefixes that ship as alias-only.
            continue;
          }
          const data = buildPackData(raw, packId, meta);
          data.samples = pickSamples(data.icons, meta.samples);
          const pages = sliceIntoPages(data.icons, pageSize);

          // Phase 1: emit pages — they have no outbound refs.
          const pagePlaceholders: string[] = [];
          pages.forEach((pageIcons, index) => {
            const refId = this.emitFile({
              type: 'asset',
              name: `iconpacks-${packId}-${index}.json`,
              source: JSON.stringify(pageIcons),
            });
            pagePlaceholders.push(placeholders.allocate(refId));
          });

          // Phase 2: build the manifest with placeholders pointing at
          // each page's eventual hashed URL.
          const manifestPayload = {
            id: data.id,
            name: data.name,
            width: data.width,
            height: data.height,
            total: data.total,
            names: data.icons.map((entry) => entry.name),
            pages: pagePlaceholders,
            pageStart: pageStartOffsets(pages),
          };
          const manifestSource = JSON.stringify(manifestPayload);

          packBuilds.push({
            info: {
              id: data.id,
              name: data.name,
              width: data.width,
              height: data.height,
              total: data.total,
              samples: data.samples,
              author: data.author,
              license: data.license,
            },
            manifestSource,
          });
        }

        // Phase 3: emit manifests.
        const manifestPlaceholders = packBuilds.map((build) => {
          const refId = this.emitFile({
            type: 'asset',
            name: `iconpacks-${build.info.id}-manifest.json`,
            source: build.manifestSource,
          });
          return placeholders.allocate(refId);
        });

        // Phase 4: emit the index with refs to each manifest.
        const indexPayload = {
          packs: packBuilds.map((build, index) => ({
            id: build.info.id,
            name: build.info.name,
            total: build.info.total,
            width: build.info.width,
            height: build.info.height,
            samples: build.info.samples,
            author: build.info.author,
            license: build.info.license,
            manifestUrl: manifestPlaceholders[index],
          })),
        };
        indexRefId = this.emitFile({
          type: 'asset',
          name: `iconpacks-index.json`,
          source: JSON.stringify(indexPayload),
        });
      }

      return `export default ${JSON.stringify(INDEX_URL_PLACEHOLDER)};`;
    },

    generateBundle: {
      // Capture URLs and rewrite placeholders before any later plugin
      // observes the bundle.
      order: 'pre',
      handler(_outputOptions, bundle) {
        const isClient = !this.environment.config.build.ssr;

        if (isClient) {
          if (indexRefId !== undefined) {
            capturedIndexUrl = `${base}${this.getFileName(indexRefId)}`;
          }

          // Resolve refs inside emitted JSON assets. We can't predict
          // which assets carry placeholders without scanning, but the
          // marker is cheap to detect.
          const resolveUrl = (refId: string): string =>
            `${base}${this.getFileName(refId)}`;
          for (const fileName of Object.keys(bundle)) {
            const asset = bundle[fileName];
            if (!asset || asset.type !== 'asset') continue;
            if (typeof asset.source !== 'string') continue;
            if (!asset.source.includes(REF_PLACEHOLDER_MARKER)) continue;
            asset.source = placeholders.replaceRefs(asset.source, resolveUrl);
          }
        }

        if (capturedIndexUrl) {
          for (const fileName of Object.keys(bundle)) {
            const chunk = bundle[fileName];
            if (!chunk || chunk.type !== 'chunk') continue;
            if (!chunk.code.includes(INDEX_URL_PLACEHOLDER)) continue;
            chunk.code = chunk.code.replaceAll(
              INDEX_URL_PLACEHOLDER,
              capturedIndexUrl,
            );
          }
        }
      },
    },
  };
};
