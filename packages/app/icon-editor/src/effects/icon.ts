import { collect } from '@lib/effects';
import { createLogger } from '@lib/observability';
import {
  findIconIndex,
  pageIndexFor,
  pageNameRange,
  parseIconRef,
  toIconRef,
  type IconEntry,
  type IconPackManifest,
  type IconPackSummary,
  type IconRef,
} from '../icons';
import {
  $editor,
  $iconEntries,
  $iconResolveStarted,
  $iconResolved,
  $loading,
  $picker,
  entryKey,
} from '../state';
import { $loadManifest, $loadPage, $packIndex } from './packs';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Read a resolved icon back out of the entry cache. Everything the ref
 * needs is already in hand by this point — the manifest for viewBox
 * defaults, the catalog for attribution, the cache for the body.
 */
const buildIconRef = (
  entries: Map<string, IconEntry>,
  pack: IconPackSummary,
  manifest: IconPackManifest,
  name: string,
): IconRef | undefined => {
  const entry = entries.get(entryKey(pack.id, name));
  if (!entry) return undefined;

  return toIconRef(
    {
      id: manifest.id,
      width: manifest.width,
      height: manifest.height,
      license: pack.license,
      author: pack.author,
    },
    entry,
  );
};

/**
 * Bracket a lookup with the resolution lifecycle, so the preview pulses
 * while it runs and a newer pick or resolve supersedes it.
 */
const resolveWith = collect(
  [$loading, $iconResolveStarted, $iconResolved],
  (load, iconResolveStarted, iconResolved) =>
    async (lookup: () => Promise<IconRef | undefined>): Promise<void> => {
      iconResolveStarted();
      const requestId = load.requestId;
      const icon = await lookup();

      if (!icon) {
        // Usually a stale shared link pointing at a now-missing icon.
        logger.debug('Resolved an icon reference that no longer exists.');
      }

      iconResolved(requestId, icon);
    },
);

/**
 * Resolve the URL's `icon` param onto the editor. Every fetch lands in
 * state first, so the chunk this drags in also fills the grid tiles
 * around it.
 *
 * Holding it loads the pack catalog, which the properties panel's pack
 * card reads whether or not the URL names an icon.
 */
export const $resolveIconParam = collect(
  [$packIndex, $editor, $iconEntries, $loadManifest, $loadPage, resolveWith],
  (packs, editor, entries, loadManifest, loadPage, resolve) =>
    async (param: string | undefined): Promise<void> => {
      const target = param ? parseIconRef(param) : undefined;
      if (!target) return;

      // The mirror echoes every icon write back as a navigation. Without
      // this the round-trip would spend a fetch — and a loading pulse — on
      // re-resolving the icon we already hold.
      const current = editor.icon;
      if (current?.pack === target.pack && current.name === target.name) {
        return;
      }

      await resolve(async () => {
        const pack = packs.find((entry) => entry.id === target.pack);
        if (!pack) return undefined;

        const manifest = await loadManifest(pack);
        const position = findIconIndex(manifest, target.name);
        if (position < 0) return undefined;

        const pageUrl = manifest.pages[pageIndexFor(manifest, position)];
        await loadPage({ packId: pack.id, pageUrl });

        return buildIconRef(entries(), pack, manifest, target.name);
      });
    },
);

const rollIndex = (count: number): number => Math.floor(Math.random() * count);

/**
 * Roll a fresh icon without leaving the active pack — style fields stay
 * put so the user keeps refining one look. Rolls a chunk, pulls it in,
 * then rolls a name inside it: one chunk is enough, so Randomize never
 * needs the whole pack in memory, and it warms the grid on the way.
 */
export const $randomizeIcon = collect(
  [$packIndex, $picker, $iconEntries, $loadManifest, $loadPage, resolveWith],
  (packs, picker, entries, loadManifest, loadPage, resolve) =>
    async (): Promise<void> => {
      const packId = picker.activePackId;

      await resolve(async () => {
        const pack = packs.find((entry) => entry.id === packId);
        if (!pack) return undefined;

        const manifest = await loadManifest(pack);
        if (manifest.pages.length === 0) return undefined;

        const pageIndex = rollIndex(manifest.pages.length);
        await loadPage({ packId, pageUrl: manifest.pages[pageIndex] });

        const [start, end] = pageNameRange(manifest, pageIndex);
        const names = manifest.names.slice(start, end);
        if (names.length === 0) return undefined;

        return buildIconRef(
          entries(),
          pack,
          manifest,
          names[rollIndex(names.length)],
        );
      });
    },
);
