import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin, ViteDevServer } from 'vite';

const VIRTUAL_ID = 'virtual:icon-packs';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

const DEV_URL_PREFIX = '/@icon-packs/';
const INDEX_URL_PLACEHOLDER = '__ICON_PACKS_INDEX_URL__';
// Per-emit placeholders use a numeric tail to avoid colliding with
// Rollup refIds, which can contain `$` and `_` characters Rollup
// reserves but our placeholder format would otherwise truncate.
const REF_PLACEHOLDER_PREFIX = '__ICON_PACKS_REF_';
const REF_PLACEHOLDER_SUFFIX = '__';

/**
 * Soft cap on the serialized size of a single page, in bytes. Packs
 * with chunky color SVGs (Fluent Emoji, etc.) blow well past 30 KB
 * gzipped at 500 icons per page; an icon-count budget produces
 * multi-megabyte chunks that defeat the lazy-load goal.
 */
const DEFAULT_MAX_PAGE_BYTES = 200_000;
/**
 * Lower bound — never emit a page with fewer icons than this even if
 * the byte budget is already blown. Keeps degenerate cases (a single
 * giant icon) from inflating the page count by orders of magnitude.
 */
const MIN_PAGE_ICONS = 16;
/** Sample previews baked into the index so the picker shows tiles up-front. */
const SAMPLE_COUNT = 5;

/**
 * A flat icon entry — the smallest unit the runtime fetches.
 * `width`/`height` are present only when the icon overrides the
 * pack-level viewBox; iconify packs occasionally ship oddly-sized
 * glyphs (Font Awesome's wider icons, brand `logos:*`).
 */
interface IconEntry {
  /** Icon name within the pack (kebab-case). */
  name: string;
  /** Inner SVG markup, stripped to a single string. */
  body: string;
  /** Per-icon viewBox width override. */
  width?: number;
  /** Per-icon viewBox height override. */
  height?: number;
}

interface PackInfo {
  id: string;
  name: string;
  width: number;
  height: number;
  total: number;
  samples: IconEntry[];
}

interface PackData extends PackInfo {
  /** All visible icons in pack order — search and pagination key off this. */
  icons: IconEntry[];
}

interface PluginOptions {
  /** Soft cap on serialized page size in bytes. */
  maxPageBytes?: number;
}

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

const findIconifyJsonRoot = async (): Promise<string> => {
  // pnpm hoists `@iconify/json` somewhere under a parent's `node_modules`.
  // Walk upward until we find it rather than relying on a sibling layout.
  let dir = moduleDir;
  while (true) {
    const candidate = path.join(dir, 'node_modules', '@iconify', 'json');
    try {
      await fs.access(path.join(candidate, 'collections.json'));
      return candidate;
    } catch {
      // Continue.
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        '@iconify/json not found — install it as a dev dep of the consumer.',
      );
    }
    dir = parent;
  }
};

interface CollectionsJson {
  [id: string]: {
    name: string;
    total?: number;
    height?: number;
    samples?: string[];
  };
}

interface RawPackJson {
  prefix: string;
  width?: number;
  height?: number;
  icons: Record<
    string,
    { body: string; hidden?: boolean; width?: number; height?: number }
  >;
}

const loadCollections = async (root: string): Promise<CollectionsJson> => {
  const text = await fs.readFile(path.join(root, 'collections.json'), 'utf8');
  return JSON.parse(text) as CollectionsJson;
};

const loadRawPack = async (root: string, id: string): Promise<RawPackJson> => {
  const text = await fs.readFile(path.join(root, 'json', `${id}.json`), 'utf8');
  return JSON.parse(text) as RawPackJson;
};

const buildPackData = (
  raw: RawPackJson,
  id: string,
  name: string,
): PackData => {
  const width = raw.width ?? raw.height ?? 24;
  const height = raw.height ?? raw.width ?? 24;
  const icons: IconEntry[] = [];
  for (const [iconName, def] of Object.entries(raw.icons)) {
    if (def.hidden) continue;
    if (!def.body) continue;
    const entry: IconEntry = { name: iconName, body: def.body };
    // Iconify lets icons override the pack viewBox — Font Awesome's
    // wider glyphs and many `logos:*` entries do this. Only keep the
    // override field when it differs, so the runtime falls back to
    // the pack default for the common case.
    if (def.width !== undefined && def.width !== width) entry.width = def.width;
    if (def.height !== undefined && def.height !== height) {
      entry.height = def.height;
    }
    icons.push(entry);
  }
  return {
    id,
    name,
    width,
    height,
    total: icons.length,
    samples: [],
    icons,
  };
};

const pickSamples = (
  icons: IconEntry[],
  preferred: ReadonlyArray<string> | undefined,
): IconEntry[] => {
  const byName = new Map(icons.map((entry) => [entry.name, entry]));
  const out: IconEntry[] = [];
  if (preferred) {
    for (const name of preferred) {
      const entry = byName.get(name);
      if (entry && !out.includes(entry)) out.push(entry);
      if (out.length >= SAMPLE_COUNT) break;
    }
  }
  // Top up with stable picks from the front of the list — small packs
  // sometimes have no `samples` array in the metadata.
  for (let idx = 0; out.length < SAMPLE_COUNT && idx < icons.length; idx += 1) {
    if (!out.includes(icons[idx])) out.push(icons[idx]);
  }
  return out;
};

/**
 * Slice the icon list into pages whose serialized payload stays
 * under {@link maxBytes}. Falls back to {@link MIN_PAGE_ICONS} per
 * page when a single icon already busts the budget — page sizes are
 * a soft target, not a hard limit.
 */
const sliceIntoPages = (
  icons: IconEntry[],
  maxBytes: number,
): IconEntry[][] => {
  const pages: IconEntry[][] = [];
  let current: IconEntry[] = [];
  let currentBytes = 2; // outer `[]`
  for (const icon of icons) {
    const entrySize = JSON.stringify(icon).length + 1; // entry + comma
    const wouldExceed = currentBytes + entrySize > maxBytes;
    if (wouldExceed && current.length >= MIN_PAGE_ICONS && current.length > 0) {
      pages.push(current);
      current = [];
      currentBytes = 2;
    }
    current.push(icon);
    currentBytes += entrySize;
  }
  if (current.length > 0) pages.push(current);
  // Always emit at least one page so the runtime can use a
  // `pages.length === 0` precondition as "this pack is empty."
  if (pages.length === 0) pages.push([]);

  return pages;
};

/**
 * For each page, the index of its first icon within the flattened
 * pack. Lets the runtime locate which page contains a given icon
 * without round-tripping a per-icon page index.
 */
const pageStartOffsets = (
  pages: ReadonlyArray<ReadonlyArray<IconEntry>>,
): number[] => {
  const offsets: number[] = [];
  let cursor = 0;
  for (const page of pages) {
    offsets.push(cursor);
    cursor += page.length;
  }
  return offsets;
};

interface PackBuild {
  info: PackInfo;
  /** Manifest payload, with `__ICON_PACKS_REF_<refId>__` placeholders. */
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
  const maxPageBytes = options.maxPageBytes ?? DEFAULT_MAX_PAGE_BYTES;

  let server: ViteDevServer | undefined;
  let base = '/';

  // Build-time state shared across environments. SolidStart builds
  // client first, so by the time SSR's `generateBundle` runs the
  // placeholder URLs are populated.
  let indexRefId: string | undefined;
  let capturedIndexUrl: string | undefined;
  // Counter-keyed placeholders → emitted refId. Replacement walks the
  // map and does a literal `replaceAll`, sidestepping the question of
  // which characters Rollup permits in refIds (they can contain `$`,
  // `_`, etc., which a regex would have to enumerate).
  const placeholderToRefId = new Map<string, string>();
  let nextPlaceholderId = 0;
  const allocatePlaceholder = (refId: string): string => {
    const placeholder = `${REF_PLACEHOLDER_PREFIX}${nextPlaceholderId}${REF_PLACEHOLDER_SUFFIX}`;
    nextPlaceholderId += 1;
    placeholderToRefId.set(placeholder, refId);
    return placeholder;
  };

  // Dev cache: a pack's full processed data, keyed by id.
  const devPackCache = new Map<string, PackData>();
  let devCollectionsPromise: Promise<CollectionsJson> | undefined;
  let iconifyRootPromise: Promise<string> | undefined;

  const getIconifyRoot = (): Promise<string> => {
    iconifyRootPromise ??= findIconifyJsonRoot();
    return iconifyRootPromise;
  };

  const getCollections = async (): Promise<CollectionsJson> => {
    devCollectionsPromise ??= getIconifyRoot().then(loadCollections);
    return devCollectionsPromise;
  };

  const getPackData = async (id: string): Promise<PackData | undefined> => {
    const cached = devPackCache.get(id);
    if (cached) return cached;
    const collections = await getCollections();
    const meta = collections[id];
    if (!meta) return undefined;
    const root = await getIconifyRoot();
    let raw: RawPackJson;
    try {
      raw = await loadRawPack(root, id);
    } catch {
      return undefined;
    }
    const data = buildPackData(raw, id, meta.name);
    data.samples = pickSamples(data.icons, meta.samples);
    devPackCache.set(id, data);
    return data;
  };

  const replaceRefs = (
    text: string,
    resolveUrl: (refId: string) => string,
  ): string => {
    if (!text.includes(REF_PLACEHOLDER_PREFIX)) return text;
    let result = text;
    for (const [placeholder, refId] of placeholderToRefId) {
      if (!result.includes(placeholder)) continue;
      result = result.replaceAll(placeholder, resolveUrl(refId));
    }
    return result;
  };

  return {
    name: '@dev/build:icon-packs',
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
        const respondJson = (payload: unknown) => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify(payload));
        };
        const notFound = () => {
          res.statusCode = 404;
          res.end();
        };

        const handle = async () => {
          if (tail === 'index.json') {
            const collections = await getCollections();
            const packs = Object.entries(collections)
              .map(([id, info]) => ({
                id,
                name: info.name,
                total: info.total ?? 0,
                // Placeholder dimensions — overwritten by `data.width`
                // / `data.height` from the actual pack JSON below.
                // `collections.json` only carries `height`, and a few
                // packs (Academicons 448×512, Ant Design 1024×1024)
                // have non-square viewBoxes that the metadata can't
                // express. Without the override, sample bodies render
                // against the wrong viewBox and clip off-screen.
                width: 24,
                height: 24,
                // Samples are looked up lazily inside the dev manifest
                // route; the index itself only needs cheap metadata.
                samples: [] as IconEntry[],
                manifestUrl: `${DEV_URL_PREFIX}${id}/manifest.json`,
              }))
              .sort((left, right) => left.name.localeCompare(right.name, 'en'));
            // Resolve sample bodies + accurate dimensions in parallel
            // so the picker can preview icons without a follow-up
            // fetch per pack.
            await Promise.all(
              packs.map(async (entry) => {
                const data = await getPackData(entry.id);
                if (!data) return;
                entry.samples = data.samples;
                entry.width = data.width;
                entry.height = data.height;
              }),
            );
            respondJson({ packs });
            return;
          }

          const segments = tail.split('/');
          if (segments.length !== 2) {
            notFound();
            return;
          }
          const [packId, leaf] = segments;
          const data = await getPackData(packId);
          if (!data) {
            notFound();
            return;
          }

          if (leaf === 'manifest.json') {
            const pages = sliceIntoPages(data.icons, maxPageBytes);
            respondJson({
              id: data.id,
              name: data.name,
              width: data.width,
              height: data.height,
              total: data.total,
              names: data.icons.map((entry) => entry.name),
              pages: pages.map(
                (_page, index) => `${DEV_URL_PREFIX}${packId}/${index}.json`,
              ),
              pageStart: pageStartOffsets(pages),
            });
            return;
          }

          const pageMatch = /^(\d+)\.json$/.exec(leaf);
          if (!pageMatch) {
            notFound();
            return;
          }
          const pageIndex = Number(pageMatch[1]);
          const pages = sliceIntoPages(data.icons, maxPageBytes);
          if (pageIndex < 0 || pageIndex >= pages.length) {
            notFound();
            return;
          }
          respondJson(pages[pageIndex]);
        };

        handle().catch((err: unknown) => next(err));
      });
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
        const root = await findIconifyJsonRoot();
        const collections = await loadCollections(root);
        // Sort once up front so the emitted index is alphabetical;
        // every downstream array (manifestPlaceholders, indexPayload)
        // inherits this order.
        const packIds = Object.keys(collections).sort((left, right) =>
          collections[left].name.localeCompare(collections[right].name, 'en'),
        );

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
          const data = buildPackData(raw, packId, meta.name);
          data.samples = pickSamples(data.icons, meta.samples);
          const pages = sliceIntoPages(data.icons, maxPageBytes);

          // Phase 1: emit pages — they have no outbound refs.
          const pagePlaceholders: string[] = [];
          pages.forEach((pageIcons, index) => {
            const refId = this.emitFile({
              type: 'asset',
              name: `iconpacks-${packId}-${index}.json`,
              source: JSON.stringify(pageIcons),
            });
            pagePlaceholders.push(allocatePlaceholder(refId));
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
          return allocatePlaceholder(refId);
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
          // placeholder prefix is cheap to detect.
          const resolveUrl = (refId: string): string =>
            `${base}${this.getFileName(refId)}`;
          for (const fileName of Object.keys(bundle)) {
            const asset = bundle[fileName];
            if (!asset || asset.type !== 'asset') continue;
            if (typeof asset.source !== 'string') continue;
            if (!asset.source.includes(REF_PLACEHOLDER_PREFIX)) continue;
            asset.source = replaceRefs(asset.source, resolveUrl);
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
