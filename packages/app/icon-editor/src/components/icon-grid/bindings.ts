import { defineAction, defineEffect } from '@lib/state';
import {
  loadIconPackIndex,
  loadIconPackManifest,
  loadIconPageEntries,
  type IconEntry,
  type IconPackManifest,
  type IconPackSummary,
  type IconPageResult,
} from '../../icons';
import { entryKey, pickerStore, type PickerView } from './store';

export const setView = defineAction(
  [pickerStore],
  (state, view: PickerView) => {
    state.view = view;
  },
);

/** Switch the active pack and reset filter/page state for the new context. */
export const openPack = defineAction([pickerStore], (state, packId: string) => {
  state.activePackId = packId;
  state.search = '';
  state.currentPage = 0;
  state.view = 'pack-detail';
});

/** Update the in-pack search filter; resets page so results aren't hidden behind a stale page index. */
export const setSearch = defineAction([pickerStore], (state, query: string) => {
  state.search = query;
  state.currentPage = 0;
});

export const setPackSearch = defineAction(
  [pickerStore],
  (state, query: string) => {
    state.packSearch = query;
  },
);

export const setCurrentPage = defineAction(
  [pickerStore],
  (state, page: number) => {
    state.currentPage = page;
  },
);

/** A single `(pack, entry)` write into the body cache. */
export interface SeedEntry {
  pack: string;
  entry: IconEntry;
}

/**
 * Insert one entry into the body cache and bump the version. Skipped
 * when the entry is already cached — overwriting with a structurally
 * equal but referentially new object would churn store identity,
 * forcing the tile's `innerHTML` binding to re-bind and restart any
 * CSS animations on the inner SVG nodes (visible in Material Line
 * Icons).
 */
export const seedEntry = defineAction(
  [pickerStore],
  (state, seed: SeedEntry) => {
    const key = entryKey(seed.pack, seed.entry.name);
    const entries = state.entries.current;
    if (entries.has(key)) return;
    entries.set(key, seed.entry);
    state.entriesVersion += 1;
  },
);

/**
 * Bulk-insert a page chunk's entries and bump the version once. The
 * single notification means every tile that read through `getEntry`
 * re-evaluates once per chunk arrival, not once per icon.
 */
export const ingestPage = defineAction(
  [pickerStore],
  (state, ingest: IconPageResult) => {
    const entries = state.entries.current;
    let added = false;
    for (const entry of ingest.entries) {
      const key = entryKey(ingest.packId, entry.name);
      if (entries.has(key)) continue;
      entries.set(key, entry);
      added = true;
    }
    if (added) state.entriesVersion += 1;
  },
);

/**
 * Drop manifests + entries that don't belong to `activePackId`.
 * Called alongside the module-level cache release so the picker's
 * proxy state and the fetcher caches stay in sync.
 */
export const releaseInactivePacks = defineAction(
  [pickerStore],
  (state, activePackId: string) => {
    for (const key of Object.keys(state.manifests)) {
      if (key !== activePackId) {
        delete state.manifests[key];
      }
    }
    const entries = state.entries.current;
    const prefix = `${activePackId}:`;
    let removed = false;
    for (const key of [...entries.keys()]) {
      if (!key.startsWith(prefix)) {
        entries.delete(key);
        removed = true;
      }
    }
    if (removed) state.entriesVersion += 1;
  },
);

export const setPacks = defineAction(
  [pickerStore],
  (state, packs: ReadonlyArray<IconPackSummary>) => {
    state.packs = packs;
  },
);

export const setManifest = defineAction(
  [pickerStore],
  (state, manifest: IconPackManifest) => {
    state.manifests[manifest.id] = manifest;
  },
);

export const loadPacksEffect = defineEffect([], loadIconPackIndex, {
  onSuccess: setPacks,
});

export const loadManifestEffect = defineEffect([], loadIconPackManifest, {
  onSuccess: setManifest,
});

export const loadPageEffect = defineEffect([], loadIconPageEntries, {
  onSuccess: ingestPage,
});
