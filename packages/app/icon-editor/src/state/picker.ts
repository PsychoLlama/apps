import { defineCell, defineCommand, defineStore } from '@lib/state';
import type {
  IconEntry,
  IconPackManifest,
  IconPackSummary,
  IconPageRequest,
  IconPageResult,
  IconRef,
} from '../icons';

/** Which surface the picker is showing. */
export type PickerView = 'packs' | 'pack-detail' | 'pack-info';

/** State backing the icon picker — pack list, search, and pagination. */
export interface PickerState {
  /** Which surface is showing — pack list or icon grid for one pack. */
  view: PickerView;

  /** Pack id whose icons populate the detail grid. */
  activePackId: string;

  /** Current search filter applied to the active pack's name list. */
  search: string;

  /** Search filter applied to the pack list view. */
  packSearch: string;

  /** Zero-based page index within the filtered name list. */
  currentPage: number;

  /** Cached pack catalog — `undefined` until the index fetch resolves. */
  packs: ReadonlyArray<IconPackSummary> | undefined;

  /**
   * Per-pack manifests keyed by pack id. Plain record (not `Map`) so the
   * store's proxy notices the writes.
   */
  manifests: { [packId: string]: IconPackManifest | undefined };

  /**
   * Asset URLs already handed to the fetcher, per pack — the manifest
   * and any body chunks. The fetch trigger is derived, so it re-fires
   * whenever the view moves; this is what stops it asking twice for the
   * same asset. Failures stay recorded rather than clearing, so a broken
   * asset can't spin in a retry loop.
   */
  requested: { [packId: string]: ReadonlyArray<string> | undefined };

  /**
   * Bumped on every write to {@link $iconEntries}. Readers track this to
   * pick up new bodies; the `Map` itself stays non-reactive.
   */
  entriesVersion: number;
}

/** Icons per visible page while a search filter is active. */
const PAGE_SIZE = 60;

/** Compose the `(pack, name)` key used inside the entry cache. */
export const entryKey = (pack: string, name: string): string =>
  `${pack}:${name}`;

/** Pack the editor opens to and a reset returns the active pack to. */
export const DEFAULT_PACK_ID = 'mdi';

/**
 * The picker's browsing state. Held by the editor screen rather than by
 * the picker itself — the properties panel renders the active pack's
 * card long before the grid is opened, and browsing survives the rail
 * swapping the grid out.
 */
export const $picker = defineStore<PickerState>(() => ({
  // Land on the chooser. The pack-detail view is reached only after the
  // user picks a pack, or after a deep link resolves an icon and pulls
  // the active pack along with it.
  view: 'packs',
  activePackId: DEFAULT_PACK_ID,
  search: '',
  packSearch: '',
  currentPage: 0,
  packs: undefined,
  manifests: {},
  requested: {},
  entriesVersion: 0,
}));

/**
 * Resolved icon bodies keyed by `pack:name`. A cell, so the `Map` is
 * never proxied — per-tile reads stay on the bare `Map.get` fast path
 * instead of walking a tracking node per key, which is the dominant
 * cost when a 500-tile page re-binds. Writes mutate it in place, and
 * reactivity flows through `entriesVersion` instead.
 */
export const $iconEntries = defineCell(() => new Map<string, IconEntry>());

/**
 * Insert one entry, skipping keys already cached — overwriting with a
 * structurally equal but referentially new object churns identity,
 * forcing the tile's `innerHTML` binding to re-bind and restarting any
 * CSS animations on the inner SVG nodes (visible in Material Line
 * Icons). Returns whether anything landed, so the caller can bump the
 * version once per batch instead of once per icon.
 */
const insertEntry = (
  entries: Map<string, IconEntry>,
  pack: string,
  entry: IconEntry,
): boolean => {
  const key = entryKey(pack, entry.name);
  if (entries.has(key)) return false;
  entries.set(key, entry);
  return true;
};

/**
 * Drop manifests and bodies belonging to any pack other than the active
 * one. Keeping every visited pack's names array (one string per icon,
 * ~7000 for MDI) and bodies resident adds up fast across the catalog;
 * the browser's HTTP cache makes coming back cheap.
 */
const dropInactivePacks = (
  state: PickerState,
  entries: Map<string, IconEntry>,
  activePackId: string,
): void => {
  for (const key of Object.keys(state.manifests)) {
    if (key !== activePackId) delete state.manifests[key];
  }

  // The request ledger has to go with the data it describes. Leave it
  // behind and the dropped pack looks permanently fetched: every asset
  // marked requested, none of it in state, nothing left to re-ask.
  for (const key of Object.keys(state.requested)) {
    if (key !== activePackId) delete state.requested[key];
  }

  const prefix = `${activePackId}:`;
  let removed = false;
  for (const key of [...entries.keys()]) {
    if (key.startsWith(prefix)) continue;
    entries.delete(key);
    removed = true;
  }
  if (removed) state.entriesVersion += 1;
};

/**
 * Switch the active pack and reset filter/page state for the new context.
 *
 * @internal Shared with the editor's commands.
 */
export const openPack = (
  state: PickerState,
  entries: Map<string, IconEntry>,
  packId: string,
): void => {
  state.activePackId = packId;
  state.search = '';
  state.currentPage = 0;
  state.view = 'pack-detail';
  dropInactivePacks(state, entries, packId);
};

/**
 * A selected icon carries its pack with it. A deep link or a shuffle can
 * land an icon from a pack other than the current one, and the panel's
 * pack card must reflect that even while the picker is closed — so the
 * switch lands in the same commit as the icon write.
 *
 * @internal Shared with the editor's commands.
 */
export const adoptIcon = (
  state: PickerState,
  entries: Map<string, IconEntry>,
  icon: IconRef,
): void => {
  if (icon.pack !== state.activePackId) openPack(state, entries, icon.pack);

  // Seed the body so the grid can render the selected tile even before
  // the pack's own pages load. Must follow the switch — `openPack` drops
  // everything outside the pack it activates.
  const added = insertEntry(entries, icon.pack, {
    name: icon.name,
    body: icon.body,
    width: icon.width,
    height: icon.height,
  });

  if (added) state.entriesVersion += 1;
};

// --- Browsing ---

/** The picker swapped surfaces — pack list, icon grid, or pack info. */
export const $pickerViewChanged = defineCommand(
  [$picker],
  (state) => (view: PickerView) => {
    state.view = view;
  },
);

/**
 * The in-pack search filter changed. Snaps the page index back so
 * results aren't hidden behind a stale page.
 */
export const $searchChanged = defineCommand(
  [$picker],
  (state) => (query: string) => {
    state.search = query;
    state.currentPage = 0;
  },
);

/** The pack-list search filter changed. */
export const $packSearchChanged = defineCommand(
  [$picker],
  (state) => (query: string) => {
    state.packSearch = query;
  },
);

/** The user paged through the active pack's grid. */
export const $pageChanged = defineCommand(
  [$picker],
  (state) => (page: number) => {
    state.currentPage = page;
  },
);

// --- Fetched data ---

/** Record asset URLs against a pack, skipping any already there. */
const markRequested = (
  state: PickerState,
  packId: string,
  urls: ReadonlyArray<string>,
): void => {
  const seen = state.requested[packId] ?? [];
  const fresh = urls.filter((url) => !seen.includes(url));
  if (fresh.length > 0) state.requested[packId] = [...seen, ...fresh];
};

/**
 * Assets were handed to the fetcher, as `packId` plus the manifest or
 * chunk URLs now spoken for. Committed *before* the request so the
 * derived trigger sees them as spoken for while they're in flight.
 */
export const $packAssetsRequested = defineCommand(
  [$picker],
  (state) => (packId: string, urls: ReadonlyArray<string>) => {
    markRequested(state, packId, urls);
  },
);

/** The pack catalog landed. */
export const $packsLoaded = defineCommand(
  [$picker],
  (state) => (packs: ReadonlyArray<IconPackSummary>) => {
    state.packs = packs;
  },
);

/** A pack's manifest landed. */
export const $manifestLoaded = defineCommand(
  [$picker],
  (state) => (manifest: IconPackManifest) => {
    state.manifests[manifest.id] = manifest;
  },
);

/**
 * A body chunk landed. The version bumps once per chunk, so every tile
 * that read through the entry cache re-evaluates once per arrival
 * rather than once per icon.
 */
export const $pageIngested = defineCommand(
  [$picker, $iconEntries],
  (state, [entries]) =>
    (ingest: IconPageResult) => {
      // A chunk pulled in by a resolve never went through the derived
      // trigger, so record it here too — otherwise the grid would fetch
      // the same chunk again the first time it displays it.
      markRequested(state, ingest.packId, [ingest.pageUrl]);

      let added = false;
      for (const entry of ingest.entries) {
        added = insertEntry(entries(), ingest.packId, entry) || added;
      }
      if (added) state.entriesVersion += 1;
    },
);

// --- Derived ---

/** The active pack's catalog entry, `undefined` until the index lands. */
export const activePackOf = (state: PickerState): IconPackSummary | undefined =>
  state.packs?.find((entry) => entry.id === state.activePackId);

/** The slice of icons the pack-detail grid is currently showing. */
export interface PageView {
  /** Manifest backing the slice — `undefined` until it lands. */
  manifest: IconPackManifest | undefined;

  /** Icon names on the current page. */
  names: ReadonlyArray<string>;

  /** Asset chunk indices the visible names need bodies from. */
  chunks: ReadonlyArray<number>;

  /** Zero-based index of the first visible icon within the filtered list. */
  start: number;

  /** Icons matching the current filter. */
  total: number;

  /** Page index, clamped — a search shrink can strand the stored one past the end. */
  page: number;

  /** Pages available under the current regime. */
  pageCount: number;
}

const EMPTY_PAGE_VIEW: PageView = {
  manifest: undefined,
  names: [],
  chunks: [],
  start: 0,
  total: 0,
  page: 0,
  pageCount: 1,
};

/**
 * Pagination over the active pack. Two regimes:
 *
 * - **Unfiltered**: each UI page maps 1:1 to one asset chunk. Paging
 *   costs exactly one fetch, no chunk is ever straddled, and page sizes
 *   vary because chunks are byte-budgeted.
 * - **Filtered**: search hits don't honour chunk boundaries, so fall
 *   back to a fixed `PAGE_SIZE` slice. Each match's owning chunk rides
 *   along from the filter walk — probing `names.indexOf` per visible
 *   tile would re-walk the proxied name array hundreds of times a page.
 *
 * Walks the whole name list on a search, so memoize it.
 */
export const pageViewOf = (state: PickerState): PageView => {
  const manifest = state.manifests[state.activePackId];
  if (!manifest) return EMPTY_PAGE_VIEW;

  const term = state.search.trim().toLowerCase();

  if (term.length === 0) {
    const pageCount = Math.max(1, manifest.pages.length);
    const page = Math.min(state.currentPage, pageCount - 1);
    const start = manifest.pageStart[page] ?? 0;
    const end = manifest.pageStart[page + 1] ?? manifest.total;
    return {
      manifest,
      names: manifest.names.slice(start, end),
      chunks: [page],
      start,
      total: manifest.names.length,
      page,
      pageCount,
    };
  }

  const matches: string[] = [];
  const owners: number[] = [];
  let chunk = 0;
  for (let idx = 0; idx < manifest.names.length; idx += 1) {
    // Advance the cursor as the position crosses a chunk boundary, so
    // the whole walk stays linear instead of paying a lookup per match.
    while (
      chunk + 1 < manifest.pageStart.length &&
      idx >= manifest.pageStart[chunk + 1]
    ) {
      chunk += 1;
    }
    const name = manifest.names[idx];
    if (!name.toLowerCase().includes(term)) continue;
    matches.push(name);
    owners.push(chunk);
  }

  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const page = Math.min(state.currentPage, pageCount - 1);
  const start = page * PAGE_SIZE;
  return {
    manifest,
    names: matches.slice(start, start + PAGE_SIZE),
    chunks: [...new Set(owners.slice(start, start + PAGE_SIZE))],
    start,
    total: matches.length,
    page,
    pageCount,
  };
};

/** Fetches the current view needs but state doesn't hold yet. */
export interface MissingPackData {
  /** Pack whose manifest hasn't landed. Blocks everything below it. */
  manifest: IconPackSummary | undefined;

  /** Body chunks backing the visible tiles. */
  pages: ReadonlyArray<IconPageRequest>;
}

const NOTHING_MISSING: MissingPackData = { manifest: undefined, pages: [] };

/**
 * What the picker still has to fetch: what the view needs, minus what
 * state already holds, minus what's already been asked for. Derived
 * rather than tracked, so every path that moves the active pack, the
 * filter, or the page — user click, deep link, reset — converges on the
 * same answer without each one remembering to kick off its own request.
 */
export const missingPackDataOf = (
  state: PickerState,
  view: PageView,
): MissingPackData => {
  const pack = activePackOf(state);
  if (!pack) return NOTHING_MISSING;

  const requested = state.requested[pack.id] ?? [];

  if (!view.manifest) {
    return requested.includes(pack.manifestUrl)
      ? NOTHING_MISSING
      : { manifest: pack, pages: [] };
  }

  const manifest = view.manifest;
  const pages: IconPageRequest[] = [];
  for (const idx of view.chunks) {
    const pageUrl = manifest.pages[idx];
    if (pageUrl && !requested.includes(pageUrl)) {
      pages.push({ packId: manifest.id, pageUrl });
    }
  }
  return { manifest: undefined, pages };
};
