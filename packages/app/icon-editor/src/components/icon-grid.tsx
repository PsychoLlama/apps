/* eslint-disable solid/no-innerhtml -- icon bodies come from bundled
 * iconify packs, sliced and emitted as static assets at build time. No
 * untrusted input ever reaches innerHTML. */

import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  on,
} from 'solid-js';
import type { Component } from 'solid-js';
import {
  createStore,
  defineAction,
  defineEffect,
  defineStore,
  useAction,
  useEffect,
} from '@lib/state';
import { Badge, Flex, IconButton, Text, TextField } from '@lib/ui';
import IconBack from 'virtual:icons/mdi/arrow-left';
import IconClose from 'virtual:icons/mdi/close';
import IconNext from 'virtual:icons/mdi/chevron-right';
import IconPrev from 'virtual:icons/mdi/chevron-left';
import IconSearch from 'virtual:icons/mdi/magnify';
import {
  loadIconPackIndex,
  loadIconPackManifest,
  loadIconPageEntries,
  pageIndexFor,
  releaseInactivePackCaches,
  toIconRef,
  type IconEntry,
  type IconPackManifest,
  type IconPackSummary,
  type IconPageResult,
  type IconRef,
} from '../icons';
import * as css from './icon-grid.css';

/**
 * Icons per visible page in the pack-detail grid. Sized so a typical
 * inspector rail (~7-10 columns) shows ~6-9 rows before paging — wide
 * enough to scan, short enough that scroll-then-page beats endless
 * scrolling.
 */
const PAGE_SIZE = 60;

const numberFormat = new Intl.NumberFormat();

type View = 'packs' | 'pack-detail';

interface PickerState {
  /** Which surface is showing — pack list or icon grid for one pack. */
  view: View;
  /** Pack id whose icons populate the detail grid. */
  activePackId: string;
  /** Current search filter applied to the active pack's name list. */
  search: string;
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
   * Resolved icon entries keyed by `pack:name`. Stores the full
   * entry (not just body) so per-icon viewBox overrides survive a
   * pick. Plain record for the same reactivity reason as
   * `manifests`.
   */
  entries: { [key: string]: IconEntry | undefined };
}

const initialState = (): PickerState => ({
  // Land on the chooser. The pack-detail view is reached only after
  // the user picks a pack (or a deep link forces a sync via the
  // selected.pack effect below).
  view: 'packs',
  activePackId: 'mdi',
  search: '',
  currentPage: 0,
  packs: undefined,
  manifests: {},
  entries: {},
});

const pickerStore = defineStore<PickerState>(initialState);
const picker = createStore(pickerStore);

const entryKey = (pack: string, name: string): string => `${pack}:${name}`;

const setViewAction = defineAction([pickerStore], (state, view: View) => {
  state.view = view;
});

const openPackAction = defineAction([pickerStore], (state, packId: string) => {
  state.activePackId = packId;
  state.search = '';
  state.currentPage = 0;
  state.view = 'pack-detail';
});

const setSearchAction = defineAction([pickerStore], (state, query: string) => {
  state.search = query;
  // Reset to the first page so search results aren't hidden behind a
  // stale page index from the previous filter.
  state.currentPage = 0;
});

const setCurrentPageAction = defineAction(
  [pickerStore],
  (state, page: number) => {
    state.currentPage = page;
  },
);

interface SeedEntry {
  pack: string;
  entry: IconEntry;
}

const seedEntryAction = defineAction(
  [pickerStore],
  (state, seed: SeedEntry) => {
    const key = entryKey(seed.pack, seed.entry.name);
    // Skip when the entry is already cached — overwriting with a
    // structurally equal but referentially new object would churn
    // store identity, forcing the tile's `innerHTML` binding to
    // re-bind and restart any CSS animations on the inner SVG nodes
    // (visible in Material Line Icons).
    if (state.entries[key]) return;
    state.entries[key] = seed.entry;
  },
);

const ingestPageAction = defineAction(
  [pickerStore],
  (state, ingest: IconPageResult) => {
    for (const entry of ingest.entries) {
      const key = entryKey(ingest.packId, entry.name);
      if (state.entries[key]) continue;
      state.entries[key] = entry;
    }
  },
);

/**
 * Drop manifests + entries that don't belong to `activePackId`.
 * Called alongside the module-level cache release so the picker's
 * proxy state and the fetcher caches stay in sync.
 */
const releaseInactivePacksAction = defineAction(
  [pickerStore],
  (state, activePackId: string) => {
    for (const key of Object.keys(state.manifests)) {
      if (key !== activePackId) {
        delete state.manifests[key];
      }
    }
    const prefix = `${activePackId}:`;
    for (const key of Object.keys(state.entries)) {
      if (!key.startsWith(prefix)) {
        delete state.entries[key];
      }
    }
  },
);

const setPacksAction = defineAction(
  [pickerStore],
  (state, packs: ReadonlyArray<IconPackSummary>) => {
    state.packs = packs;
  },
);

const setManifestAction = defineAction(
  [pickerStore],
  (state, manifest: IconPackManifest) => {
    state.manifests[manifest.id] = manifest;
  },
);

const loadPacksEffect = defineEffect([], loadIconPackIndex, {
  onSuccess: setPacksAction,
});

const loadManifestEffect = defineEffect([], loadIconPackManifest, {
  onSuccess: setManifestAction,
});

const loadPageEffect = defineEffect([], loadIconPageEntries, {
  onSuccess: ingestPageAction,
});

interface IconGridProps {
  /** Currently selected icon — highlights the matching tile. */
  selected: IconRef;
  /** Called when the user picks a different icon. */
  onSelect: (icon: IconRef) => void;
}

/**
 * Searchable icon picker with two views: a pack list (browse all
 * iconify collections, see preview tiles) and a pack detail
 * (search-and-pick within one pack). Manifests + page chunks are
 * fetched lazily — the grid only loads bodies for icons currently
 * matching the search.
 */
export const IconGrid: Component<IconGridProps> = (props) => {
  const setView = useAction(setViewAction);
  const openPack = useAction(openPackAction);
  const setSearch = useAction(setSearchAction);
  const setCurrentPage = useAction(setCurrentPageAction);
  const seedEntry = useAction(seedEntryAction);
  const releaseInactivePacks = useAction(releaseInactivePacksAction);
  const loadPacks = useEffect(loadPacksEffect);
  const loadManifest = useEffect(loadManifestEffect);
  const loadPage = useEffect(loadPageEffect);

  // Fetch the pack catalog once on mount. The store caches it so a
  // re-mount (e.g. tab switching) reuses the resolved list.
  createEffect(() => {
    if (!picker.packs) void loadPacks();
  });

  // Sync the active pack when the *selected* icon's pack changes —
  // opening the editor at `?icon=tabler:rocket` should land on the
  // tabler pack detail, not on mdi's. `on()` so the effect doesn't
  // re-fire when the user manually switches packs (which would
  // immediately revert their choice).
  createEffect(
    on(
      () => props.selected.pack,
      (pack) => {
        if (pack !== picker.activePackId) openPack(pack);
      },
    ),
  );

  // Keep the entries map seeded with the currently selected icon —
  // even before the manifest loads, the picker knows it can render
  // the selected tile. URL hydration sometimes resolves an icon
  // outside the active pack's loaded pages.
  createEffect(() => {
    seedEntry({
      pack: props.selected.pack,
      entry: {
        name: props.selected.name,
        body: props.selected.body,
        width: props.selected.width,
        height: props.selected.height,
      },
    });
  });

  // `loadIconPage` caches at the module level, so this Set's only job
  // is to keep `loadPage` from re-dispatching the success action with
  // bodies already ingested. Recreated on every pack switch so the
  // freshly-cleared module cache and this guard stay in sync.
  let requestedUrls = new Set<string>();

  // Memory release when switching packs — drop fetcher caches plus
  // the picker's manifests/entries for inactive packs. The active
  // pack's data stays put. `defer: true` skips the initial run since
  // there's nothing to release on first mount.
  createEffect(
    on(
      () => picker.activePackId,
      (activePackId) => {
        releaseInactivePackCaches(activePackId);
        releaseInactivePacks(activePackId);
        requestedUrls = new Set();
      },
      { defer: true },
    ),
  );

  const activePack = createMemo<IconPackSummary | undefined>(() => {
    const list = picker.packs;
    if (!list) return undefined;
    return list.find((entry) => entry.id === picker.activePackId);
  });

  // Trigger manifest fetches as the active pack changes.
  createEffect(() => {
    const pack = activePack();
    if (!pack) return;
    if (picker.manifests[pack.id]) return;
    void loadManifest(pack);
  });

  const activeManifest = createMemo<IconPackManifest | undefined>(
    () => picker.manifests[picker.activePackId],
  );

  /**
   * Filtered name list — pure function of the active manifest + the
   * trimmed search term. Pagination slices on top of this so the
   * filter recomputes only when the manifest or search changes.
   */
  const matches = createMemo<ReadonlyArray<string>>(() => {
    const manifest = activeManifest();
    if (!manifest) return [];
    const term = picker.search.trim().toLowerCase();
    if (!term) return manifest.names;
    return manifest.names.filter((name) => name.toLowerCase().includes(term));
  });

  const isFiltered = createMemo(() => picker.search.trim().length > 0);

  /**
   * Page count + per-page slice. Two regimes:
   *
   * - **Unfiltered**: each UI page maps 1:1 to one asset chunk
   *   (`manifest.pages[i]`). Clicking next loads exactly one new
   *   chunk — predictable network cost, no over-fetch, no chunk
   *   straddling. Page sizes vary because chunks are byte-budgeted.
   * - **Filtered**: search hits don't honour chunk boundaries, so
   *   fall back to a fixed `PAGE_SIZE`-tile slice over the matches.
   */
  const pageCount = createMemo(() => {
    const manifest = activeManifest();
    if (!manifest) return 1;
    if (isFiltered())
      return Math.max(1, Math.ceil(matches().length / PAGE_SIZE));
    return Math.max(1, manifest.pages.length);
  });
  /** Clamp the requested page index against the current filter — a search shrink may strand us past the last page. */
  const safePage = createMemo(() =>
    Math.min(picker.currentPage, pageCount() - 1),
  );

  /** First-icon index (0-based) for the active page within `matches`. */
  const pageStart = createMemo(() => {
    const manifest = activeManifest();
    if (!manifest) return 0;
    if (isFiltered()) return safePage() * PAGE_SIZE;
    return manifest.pageStart[safePage()] ?? 0;
  });

  const visible = createMemo<ReadonlyArray<string>>(() => {
    const manifest = activeManifest();
    if (!manifest) return [];
    if (isFiltered()) {
      const list = matches();
      const start = pageStart();
      return list.slice(start, start + PAGE_SIZE);
    }
    const start = pageStart();
    const next = manifest.pageStart[safePage() + 1] ?? manifest.total;
    return manifest.names.slice(start, next);
  });

  // Whenever the visible set changes, request the page chunks needed
  // to render their bodies.
  createEffect(() => {
    const manifest = activeManifest();
    if (!manifest) return;
    const names = visible();
    if (names.length === 0) return;
    const needed = new Set<number>();
    for (const name of names) {
      const position = manifest.names.indexOf(name);
      if (position < 0) continue;
      needed.add(pageIndexFor(manifest, position));
    }
    for (const idx of needed) {
      const pageUrl = manifest.pages[idx];
      if (!pageUrl || requestedUrls.has(pageUrl)) continue;
      requestedUrls.add(pageUrl);
      void loadPage({ packId: manifest.id, pageUrl });
    }
  });

  const handlePickIcon = (manifest: IconPackManifest, name: string) => {
    const entry = picker.entries[entryKey(manifest.id, name)];
    if (!entry) return;
    props.onSelect(toIconRef(manifest, entry));
  };

  return (
    <Flex as="div" direction="column" gap={3} grow class={css.root}>
      <Switch>
        <Match when={picker.view === 'packs'}>
          <PackListView
            packs={picker.packs}
            activePackId={picker.activePackId}
            onPick={openPack}
          />
        </Match>
        <Match when={picker.view === 'pack-detail'}>
          <PackDetailView
            pack={activePack()}
            manifest={activeManifest()}
            entries={picker.entries}
            search={picker.search}
            onSearch={setSearch}
            visible={visible()}
            pageStart={pageStart()}
            total={matches().length}
            currentPage={safePage()}
            pageCount={pageCount()}
            onPageChange={setCurrentPage}
            selected={props.selected}
            onPickIcon={handlePickIcon}
            onOpenPackList={() => setView('packs')}
          />
        </Match>
      </Switch>
    </Flex>
  );
};

interface PackListViewProps {
  packs: ReadonlyArray<IconPackSummary> | undefined;
  activePackId: string;
  onPick: (id: string) => void;
}

const PackListView: Component<PackListViewProps> = (props) => (
  <Flex as="div" direction="column" gap={2} grow class={css.root}>
    <Show
      when={props.packs && props.packs.length > 0}
      fallback={
        <Flex as="div" justify="center" class={css.empty}>
          <Text as="span" size={2} color="lowContrast" selectable={false}>
            Loading packs…
          </Text>
        </Flex>
      }
    >
      {/* Vertical scroller of pack cards. No @lib/ui equivalent —
       *  a stylized list with explicit overflow + flex behavior. */}
      {/* eslint-disable-next-line custom/require-ui-primitives */}
      <div class={css.packList}>
        <For each={props.packs}>
          {(pack) => (
            // eslint-disable-next-line custom/require-ui-primitives
            <button
              type="button"
              class={css.packCard}
              classList={{
                [css.packCardActive]: pack.id === props.activePackId,
              }}
              aria-pressed={pack.id === props.activePackId}
              onClick={() => props.onPick(pack.id)}
            >
              <Flex as="div" direction="column" gap={2} grow>
                <Flex as="div" align="baseline" justify="between" gap={2}>
                  <Text
                    as="span"
                    size={2}
                    weight="medium"
                    truncate
                    selectable={false}
                  >
                    {pack.name}
                  </Text>
                  <Text
                    as="span"
                    size={1}
                    color="lowContrast"
                    selectable={false}
                  >
                    {numberFormat.format(pack.total)}
                  </Text>
                </Flex>
                <Flex as="div" align="center" justify="between" gap={2}>
                  <Flex as="div" align="center" gap={2}>
                    <For each={pack.samples}>
                      {(sample) => (
                        <svg
                          class={css.packSample}
                          viewBox={`0 0 ${sample.width ?? pack.width} ${sample.height ?? pack.height}`}
                          innerHTML={sample.body}
                        />
                      )}
                    </For>
                  </Flex>
                  <Show when={pack.license?.spdx}>
                    {(spdx) => (
                      <Badge size={1} variant="soft" color="neutral">
                        {spdx()}
                      </Badge>
                    )}
                  </Show>
                </Flex>
              </Flex>
            </button>
          )}
        </For>
      </div>
    </Show>
  </Flex>
);

interface PackDetailViewProps {
  pack: IconPackSummary | undefined;
  manifest: IconPackManifest | undefined;
  entries: Readonly<Record<string, IconEntry | undefined>>;
  search: string;
  onSearch: (value: string) => void;
  visible: ReadonlyArray<string>;
  /** First-icon index (0-based) of the current page within the filtered list. */
  pageStart: number;
  total: number;
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  selected: IconRef;
  onPickIcon: (manifest: IconPackManifest, name: string) => void;
  onOpenPackList: () => void;
}

const PackDetailView: Component<PackDetailViewProps> = (props) => {
  const goPrev = () => props.onPageChange(Math.max(0, props.currentPage - 1));
  const goNext = () =>
    props.onPageChange(Math.min(props.pageCount - 1, props.currentPage + 1));
  const formatRange = () => {
    const start = props.pageStart + 1;
    const end = start + props.visible.length - 1;
    return `${numberFormat.format(start)}–${numberFormat.format(end)} of ${numberFormat.format(props.total)}`;
  };

  return (
    <>
      <Flex as="div" align="center" gap={2}>
        <IconButton
          testId="icon-grid-pack-list"
          size={1}
          variant="ghost"
          color="neutral"
          aria-label="Browse icon packs"
          onClick={props.onOpenPackList}
        >
          <IconBack aria-hidden />
        </IconButton>
        <Text as="span" size={2} weight="medium" truncate selectable={false}>
          {props.pack?.name ?? 'Loading…'}
        </Text>
      </Flex>

      <TextField
        testId="icon-grid-search"
        type="search"
        placeholder="Search icons…"
        autocomplete="off"
        autocapitalize="none"
        enterkeyhint="search"
        value={props.search}
        onInput={(event) => props.onSearch(event.currentTarget.value)}
        aria-label="Search icons"
        left={<IconSearch aria-hidden />}
        right={
          <Show when={props.search.length > 0}>
            <IconButton
              testId="icon-grid-search-clear"
              size={1}
              variant="ghost"
              color="neutral"
              aria-label="Clear search"
              onClick={() => props.onSearch('')}
            >
              <IconClose aria-hidden />
            </IconButton>
          </Show>
        }
      />

      <Show
        when={props.manifest}
        fallback={
          <Flex as="div" justify="center" class={css.empty}>
            <Text as="span" size={2} color="lowContrast" selectable={false}>
              Loading {props.pack?.name ?? 'pack'}…
            </Text>
          </Flex>
        }
      >
        {(manifest) => (
          <Show
            when={props.total > 0}
            fallback={
              <Flex as="div" justify="center" class={css.empty}>
                <Text as="span" size={2} color="lowContrast" selectable={false}>
                  No icons match “{props.search}”
                </Text>
              </Flex>
            }
          >
            {/* CSS Grid with auto-fill columns has no @lib/ui equivalent. */}
            {/* eslint-disable-next-line custom/require-ui-primitives */}
            <div class={css.grid}>
              <For each={props.visible}>
                {(name) => {
                  const entry = () =>
                    props.entries[entryKey(manifest().id, name)];
                  const isSelected = () =>
                    props.selected.pack === manifest().id &&
                    props.selected.name === name;
                  return (
                    // The tile is a custom-styled click target with no
                    // @lib/ui analogue (Button enforces solid/soft/etc).
                    // eslint-disable-next-line custom/require-ui-primitives
                    <button
                      type="button"
                      class={css.tile}
                      classList={{ [css.tileActive]: isSelected() }}
                      title={name}
                      aria-label={name}
                      aria-pressed={isSelected()}
                      disabled={!entry()}
                      onClick={() => props.onPickIcon(manifest(), name)}
                    >
                      <Show
                        when={entry()}
                        fallback={
                          // Skeleton block while the body fetches.
                          // eslint-disable-next-line custom/require-ui-primitives
                          <span class={css.tileSkeleton} aria-hidden />
                        }
                      >
                        {(loaded) => {
                          const ref = () => toIconRef(manifest(), loaded());
                          return (
                            <svg
                              class={css.tileIcon}
                              viewBox={`0 0 ${ref().width} ${ref().height}`}
                              innerHTML={ref().body}
                            />
                          );
                        }}
                      </Show>
                    </button>
                  );
                }}
              </For>
            </div>
            <Flex
              as="nav"
              align="center"
              justify="between"
              gap={2}
              aria-label="Pagination"
              class={css.pager}
            >
              <IconButton
                testId="icon-grid-prev-page"
                size={1}
                variant="ghost"
                color="neutral"
                aria-label="Previous page"
                disabled={props.currentPage === 0}
                onClick={goPrev}
              >
                <IconPrev aria-hidden />
              </IconButton>
              <Text as="span" size={1} color="lowContrast" selectable={false}>
                {formatRange()}
              </Text>
              <IconButton
                testId="icon-grid-next-page"
                size={1}
                variant="ghost"
                color="neutral"
                aria-label="Next page"
                disabled={props.currentPage >= props.pageCount - 1}
                onClick={goNext}
              >
                <IconNext aria-hidden />
              </IconButton>
            </Flex>
          </Show>
        )}
      </Show>
    </>
  );
};
