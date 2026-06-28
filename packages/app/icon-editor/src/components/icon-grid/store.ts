import { createStore, defineStore, ref, type Ref } from '@lib/state';
import type { IconEntry, IconPackManifest, IconPackSummary } from '../../icons';

/** Which surface the picker is showing. */
export type PickerView = 'packs' | 'pack-detail' | 'pack-info';

/** State backing the icon picker — pack list, search, pagination, body cache. */
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
   * Per-pack manifests keyed by pack id. Plain record (not `Map`) so
   * solid-js/store's `createMutable` proxy notices the writes —
   * `Map` mutations bypass the proxy and never trigger downstream
   * memos.
   */
  manifests: { [packId: string]: IconPackManifest | undefined };
  /**
   * Resolved icon entries keyed by `pack:name`. Held inside a
   * `Ref` so the proxy treats the `Map` as opaque — per-tile reads
   * stay on the bare `Map.get` fast path instead of walking
   * `createMutable`'s tracking nodes (the hot cost when a 500-icon
   * page re-binds). Reactivity flows through `entriesVersion`.
   */
  entries: Ref<Map<string, IconEntry>>;
  /**
   * Bumped on every write to `entries`. Subscribers read this to
   * pick up new resolutions; the `Map` itself stays non-reactive.
   */
  entriesVersion: number;
}

/** Compose the `(pack, name)` map key used inside `state.entries`. */
export const entryKey = (pack: string, name: string): string =>
  `${pack}:${name}`;

/** Pack the editor opens to and Reset returns the active pack to. */
export const DEFAULT_PACK_ID = 'mdi';

export const pickerStore = defineStore<PickerState>(() => ({
  // Land on the chooser. The pack-detail view is reached only after
  // the user picks a pack (or a deep link forces a sync via the
  // selected.pack effect in the component).
  view: 'packs',
  activePackId: DEFAULT_PACK_ID,
  search: '',
  packSearch: '',
  currentPage: 0,
  packs: undefined,
  manifests: {},
  entries: ref(new Map<string, IconEntry>()),
  entriesVersion: 0,
}));

/** Live, readonly view of the picker state. */
export const picker = createStore(pickerStore);
