import type { Connect } from 'vite';
import type { CollectionsJson } from './iconify.ts';
import { type IconEntry, type PackData } from './pack-data.ts';
import { sortedPackIds } from './order.ts';
import { pageStartOffsets, sliceIntoPages } from './pagination.ts';

/**
 * URL prefix the dev middleware owns. Must match what the runtime
 * fetches; build assets use hashed paths and are unaffected.
 */
export const DEV_URL_PREFIX = '/@icon-packs/';

interface DevServerDeps {
  /** Resolve and cache the iconify catalog. */
  getCollections: () => Promise<CollectionsJson>;
  /** Resolve and cache one pack's processed data. */
  getPackData: (id: string) => Promise<PackData | undefined>;
  /** Icons per page chunk — same as the build path. */
  pageSize: number;
}

/**
 * Connect middleware that serves the index, per-pack manifests, and
 * page chunks at stable URLs under {@link DEV_URL_PREFIX}. Stable URLs
 * mean the runtime can hand out predictable links without a build
 * step; lazy slicing means we never process more than what the user
 * has actually scrolled to.
 */
export const createDevMiddleware = (
  deps: DevServerDeps,
): Connect.NextHandleFunction => {
  const { getCollections, getPackData, pageSize } = deps;

  return (req, res, next) => {
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
        const packs = sortedPackIds(collections).map((id) => {
          const info = collections[id];
          return {
            id,
            name: info.name,
            total: info.total ?? 0,
            // Placeholder dimensions — overwritten by `data.width`
            // / `data.height` from the actual pack JSON below.
            // `collections.json` only carries `height`, and a few
            // packs (Academicons 448×512, Ant Design 1024×1024) have
            // non-square viewBoxes that the metadata can't express.
            // Without the override, sample bodies render against the
            // wrong viewBox and clip off-screen.
            width: 24,
            height: 24,
            // Samples and accurate dimensions resolve below; the
            // index itself only needs cheap metadata up front.
            samples: [] as IconEntry[],
            author: info.author,
            license: info.license,
            manifestUrl: `${DEV_URL_PREFIX}${id}/manifest.json`,
          };
        });
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
        const pages = sliceIntoPages(data.icons, pageSize);
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
      const pages = sliceIntoPages(data.icons, pageSize);
      if (pageIndex < 0 || pageIndex >= pages.length) {
        notFound();
        return;
      }
      respondJson(pages[pageIndex]);
    };

    handle().catch((err: unknown) => next(err));
  };
};
