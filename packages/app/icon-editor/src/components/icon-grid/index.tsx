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
  onMount,
} from 'solid-js';
import type { Component } from 'solid-js';
import { useAction, useEffect } from '@lib/state';
import {
  Badge,
  Code,
  DataListItem,
  DataListLabel,
  DataListRoot,
  DataListValue,
  Flex,
  IconButton,
  Link,
  ScrollArea,
  Text,
  TextField,
} from '@lib/ui';
import IconBack from 'virtual:icons/mdi/arrow-left';
import IconClose from 'virtual:icons/mdi/close';
import IconInfo from 'virtual:icons/mdi/information-outline';
import IconNext from 'virtual:icons/mdi/chevron-right';
import IconPrev from 'virtual:icons/mdi/chevron-left';
import IconSearch from 'virtual:icons/mdi/magnify';
import {
  releaseInactivePackCaches,
  toIconRef,
  type IconEntry,
  type IconPackManifest,
  type IconPackSummary,
  type IconRef,
} from '../../icons';
import {
  loadManifestEffect,
  loadPageEffect,
  releaseInactivePacks as releaseInactivePacksAction,
  seedEntry as seedEntryAction,
  setCurrentPage as setCurrentPageAction,
  setPackSearch as setPackSearchAction,
  setSearch as setSearchAction,
  setView as setViewAction,
} from './bindings';
import { entryKey, picker } from './store';
import { PackCard } from '../pack-card';
import * as css from './icon-grid.css';

/**
 * Icons per visible page in the pack-detail grid. Sized so a typical
 * inspector rail (~7-10 columns) shows ~6-9 rows before paging — wide
 * enough to scan, short enough that scroll-then-page beats endless
 * scrolling.
 */
const PAGE_SIZE = 60;

const numberFormat = new Intl.NumberFormat();

interface IconGridProps {
  /**
   * Currently selected icon — highlights the matching tile. `undefined`
   * before the user has picked anything; the picker still opens to the
   * default pack so browsing works without a selection.
   */
  selected: IconRef | undefined;
  /** Called when the user picks a different icon. */
  onSelect: (icon: IconRef) => void;
  /**
   * Called when the user picks a pack from the list. The editor swaps
   * the active pack (clearing the selected icon if it belonged to a
   * different one) and returns to the properties inspector.
   */
  onSelectPack: (packId: string) => void;
  /** Leave the picker and return to the properties inspector. */
  onClose: () => void;
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
  const setSearch = useAction(setSearchAction);
  const setPackSearch = useAction(setPackSearchAction);
  const setCurrentPage = useAction(setCurrentPageAction);
  const seedEntry = useAction(seedEntryAction);
  const releaseInactivePacks = useAction(releaseInactivePacksAction);
  const loadManifest = useEffect(loadManifestEffect);
  const loadPage = useEffect(loadPageEffect);

  // The pack catalog is fetched eagerly by the editor (it backs the
  // properties panel's pack card before the picker ever opens), and the
  // editor also keeps `activePackId` in lockstep with the selected
  // icon's pack, so the picker can assume both are already arranged on
  // mount.

  // Keep the entries map seeded with the currently selected icon —
  // even before the manifest loads, the picker knows it can render
  // the selected tile. URL hydration sometimes resolves an icon
  // outside the active pack's loaded pages.
  createEffect(() => {
    const selected = props.selected;
    if (!selected) return;
    seedEntry({
      pack: selected.pack,
      entry: {
        name: selected.name,
        body: selected.body,
        width: selected.width,
        height: selected.height,
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

  // Name → chunk-index lookup, built once per manifest. The naive
  // alternative — `manifest.names.indexOf(name)` per visible name —
  // walks the proxy-wrapped names array for every probe; with a
  // 500-tile page over a 7k-icon pack that's millions of proxy
  // accesses per click. The map collapses it to O(1) per lookup.
  const nameToChunkIndex = createMemo<ReadonlyMap<string, number>>(() => {
    const manifest = activeManifest();
    if (!manifest) return new Map();
    const map = new Map<string, number>();
    let chunk = 0;
    for (let idx = 0; idx < manifest.names.length; idx += 1) {
      // Advance the cursor when the position crosses a chunk
      // boundary, so the whole map builds in one linear walk
      // instead of an O(log p) `pageIndexFor` per name.
      while (
        chunk + 1 < manifest.pageStart.length &&
        idx >= manifest.pageStart[chunk + 1]
      ) {
        chunk += 1;
      }
      map.set(manifest.names[idx], chunk);
    }
    return map;
  });

  // Whenever the visible set changes, request the page chunks needed
  // to render their bodies.
  createEffect(() => {
    const manifest = activeManifest();
    if (!manifest) return;
    const names = visible();
    if (names.length === 0) return;
    const lookup = nameToChunkIndex();
    const needed = new Set<number>();
    for (const name of names) {
      const idx = lookup.get(name);
      if (idx === undefined) continue;
      needed.add(idx);
    }
    for (const idx of needed) {
      const pageUrl = manifest.pages[idx];
      if (!pageUrl || requestedUrls.has(pageUrl)) continue;
      requestedUrls.add(pageUrl);
      void loadPage({ packId: manifest.id, pageUrl });
    }
  });

  // Memoize the entries snapshot so the proxy hops for `entries` and
  // `entriesVersion` happen once per chunk arrival, not once per tile
  // per binding. `equals: false` so downstream re-runs even though the
  // `Map` reference doesn't change between bumps. Tiles read the memo
  // (a plain signal accessor) and walk the `Map` directly — no proxy
  // tracking nodes per `(pack:name)` key, the dominant cost when a
  // 500-tile page re-binds.
  const entriesSnapshot = createMemo(
    () => {
      void picker.entriesVersion;
      return picker.entries.current;
    },
    picker.entries.current,
    { equals: false },
  );

  const getEntry = (pack: string, name: string): IconEntry | undefined =>
    entriesSnapshot().get(entryKey(pack, name));

  const handlePickIcon = (manifest: IconPackManifest, name: string) => {
    const entry = getEntry(manifest.id, name);
    if (!entry) return;
    const summary = activePack();
    props.onSelect(
      toIconRef(
        {
          id: manifest.id,
          width: manifest.width,
          height: manifest.height,
          license: summary?.license,
          author: summary?.author,
        },
        entry,
      ),
    );
  };

  return (
    <Flex as="div" direction="column" gap={3} class={css.root}>
      <Switch>
        <Match when={picker.view === 'packs'}>
          <PackListView
            packs={picker.packs}
            activePackId={picker.activePackId}
            search={picker.packSearch}
            onSearch={setPackSearch}
            onPick={props.onSelectPack}
            onClose={props.onClose}
          />
        </Match>
        <Match when={picker.view === 'pack-detail'}>
          <PackDetailView
            pack={activePack()}
            manifest={activeManifest()}
            getEntry={getEntry}
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
            onClose={props.onClose}
            onShowInfo={() => setView('pack-info')}
          />
        </Match>
        <Match when={picker.view === 'pack-info'}>
          <PackInfoView
            pack={activePack()}
            onShowIcons={() => setView('pack-detail')}
          />
        </Match>
      </Switch>
    </Flex>
  );
};

interface PackListViewProps {
  packs: ReadonlyArray<IconPackSummary> | undefined;
  activePackId: string;
  search: string;
  onSearch: (value: string) => void;
  onPick: (id: string) => void;
  /** Leave the picker and return to the properties inspector. */
  onClose: () => void;
}

const PackListView: Component<PackListViewProps> = (props) => {
  const filtered = createMemo<ReadonlyArray<IconPackSummary>>(() => {
    const list = props.packs;
    if (!list) return [];
    const term = props.search.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (pack) =>
        pack.name.toLowerCase().includes(term) ||
        pack.id.toLowerCase().includes(term),
    );
  });

  // Captured on render via the active card's `ref`; consumed in
  // `onMount` to land focus on the user's last-picked pack when the
  // view is re-entered. `block: 'nearest'` keeps the page (and the
  // ScrollArea) from jumping when the active card is already visible.
  let activeButtonRef: HTMLButtonElement | undefined;
  onMount(() => {
    if (!activeButtonRef) return;
    activeButtonRef.scrollIntoView({ block: 'nearest' });
    activeButtonRef.focus({ preventScroll: true });
  });

  return (
    <>
      <Flex as="div" align="center" gap={2}>
        <IconButton
          testId="icon-grid-pack-list-close"
          size={1}
          variant="ghost"
          color="neutral"
          aria-label="Back to editor"
          onClick={props.onClose}
        >
          <IconBack aria-hidden />
        </IconButton>
        <Flex as="div" grow>
          <Text as="span" size={2} weight="medium" truncate selectable={false}>
            Icon packs
          </Text>
        </Flex>
      </Flex>

      <TextField
        testId="icon-grid-pack-search"
        type="search"
        placeholder="Search packs…"
        autocomplete="off"
        autocapitalize="none"
        enterkeyhint="search"
        value={props.search}
        onInput={(event) => props.onSearch(event.currentTarget.value)}
        aria-label="Search icon packs"
        left={<IconSearch aria-hidden />}
        right={
          <Show when={props.search.length > 0}>
            <IconButton
              testId="icon-grid-pack-search-clear"
              size={1}
              variant="ghost"
              color="neutral"
              aria-label="Clear pack search"
              onClick={() => props.onSearch('')}
            >
              <IconClose aria-hidden />
            </IconButton>
          </Show>
        }
      />

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
        <Show
          when={filtered().length > 0}
          fallback={
            <Flex as="div" justify="center" class={css.empty}>
              <Text as="span" size={2} color="lowContrast" selectable={false}>
                No packs match “{props.search}”
              </Text>
            </Flex>
          }
        >
          <ScrollArea type="hover" scrollbars="vertical" class={css.scroller}>
            <Flex as="div" direction="column" gap={3} class={css.packList}>
              <For each={filtered()}>
                {(pack) => {
                  const isActive = () => pack.id === props.activePackId;
                  return (
                    <PackCard
                      pack={pack}
                      active={isActive()}
                      ref={(el) => {
                        if (isActive()) activeButtonRef = el;
                      }}
                      onClick={() => props.onPick(pack.id)}
                    />
                  );
                }}
              </For>
            </Flex>
          </ScrollArea>
        </Show>
      </Show>
    </>
  );
};

interface PackDetailViewProps {
  pack: IconPackSummary | undefined;
  manifest: IconPackManifest | undefined;
  /**
   * Pull the resolved entry for `(pack, name)`. Subscribes to the
   * entries version signal so tiles re-render once when a fetched
   * chunk lands, without paying per-key proxy lookups.
   */
  getEntry: (pack: string, name: string) => IconEntry | undefined;
  search: string;
  onSearch: (value: string) => void;
  visible: ReadonlyArray<string>;
  /** First-icon index (0-based) of the current page within the filtered list. */
  pageStart: number;
  total: number;
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** `undefined` until the user picks an icon — no tile reads as selected. */
  selected: IconRef | undefined;
  onPickIcon: (manifest: IconPackManifest, name: string) => void;
  /** Leave the picker and return to the properties inspector. */
  onClose: () => void;
  /** Switch to the in-place pack info view (DataList of metadata). */
  onShowInfo: () => void;
}

interface PackInfoViewProps {
  pack: IconPackSummary | undefined;
  /** Return to the icon grid for the same pack — one step up the stack. */
  onShowIcons: () => void;
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
          testId="icon-grid-pack-detail-close"
          size={1}
          variant="ghost"
          color="neutral"
          aria-label="Back to editor"
          onClick={props.onClose}
        >
          <IconBack aria-hidden />
        </IconButton>
        <Flex as="div" grow>
          <Text as="span" size={2} weight="medium" truncate selectable={false}>
            {props.pack?.name ?? 'Loading…'}
          </Text>
        </Flex>
        <IconButton
          testId="icon-grid-pack-info"
          size={1}
          variant="ghost"
          color="neutral"
          aria-label="Pack information"
          onClick={props.onShowInfo}
        >
          <IconInfo aria-hidden />
        </IconButton>
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
            <ScrollArea type="hover" scrollbars="vertical" class={css.scroller}>
              {/* CSS Grid with auto-fill columns has no @lib/ui equivalent. */}
              {/* eslint-disable-next-line custom/require-ui-primitives */}
              <div class={css.grid}>
                <For each={props.visible}>
                  {(name) => {
                    const entry = () => props.getEntry(manifest().id, name);
                    const isSelected = () =>
                      props.selected?.pack === manifest().id &&
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
            </ScrollArea>
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

/**
 * Per-pack metadata in place of the icon grid. Reached via the info
 * button in {@link PackDetailView}'s header. Surfaces author + license
 * up front — discoverable at the moment the user is choosing a pack
 * rather than buried on a separate credits route.
 */
const PackInfoView: Component<PackInfoViewProps> = (props) => {
  const license = () => props.pack?.license;
  const author = () => props.pack?.author;

  return (
    <>
      <Flex as="div" align="center" gap={2}>
        <IconButton
          testId="icon-grid-pack-info-back"
          size={1}
          variant="ghost"
          color="neutral"
          aria-label="Back to icons"
          onClick={props.onShowIcons}
        >
          <IconBack aria-hidden />
        </IconButton>
        <Flex as="div" grow>
          <Text as="span" size={2} weight="medium" truncate selectable={false}>
            {props.pack?.name ?? 'Loading…'}
          </Text>
        </Flex>
      </Flex>

      <Show when={props.pack}>
        {(pack) => (
          <DataListRoot orientation="horizontal" size={1}>
            <DataListItem>
              <DataListLabel>ID</DataListLabel>
              <DataListValue>
                <Code>{pack().id}</Code>
              </DataListValue>
            </DataListItem>
            <DataListItem>
              <DataListLabel>Icons</DataListLabel>
              <DataListValue>{numberFormat.format(pack().total)}</DataListValue>
            </DataListItem>
            <Show when={author()}>
              {(value) => (
                <DataListItem>
                  <DataListLabel>Author</DataListLabel>
                  <DataListValue>
                    <Show when={value().url} fallback={value().name}>
                      {(url) => (
                        <Link
                          testId="icon-grid-pack-info-author"
                          href={url()}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {value().name}
                        </Link>
                      )}
                    </Show>
                  </DataListValue>
                </DataListItem>
              )}
            </Show>
            <Show when={license()}>
              {(value) => (
                <DataListItem>
                  <DataListLabel>License</DataListLabel>
                  <DataListValue>
                    <Show
                      when={value().url}
                      fallback={value().title ?? value().spdx ?? 'Unknown'}
                    >
                      {(url) => (
                        <Link
                          testId="icon-grid-pack-info-license"
                          href={url()}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {value().title ?? value().spdx ?? 'License'}
                        </Link>
                      )}
                    </Show>
                  </DataListValue>
                </DataListItem>
              )}
            </Show>
            <Show when={license()?.spdx}>
              {(spdx) => (
                <DataListItem>
                  <DataListLabel>SPDX</DataListLabel>
                  <DataListValue>
                    <Badge size={1} variant="soft" color="neutral">
                      {spdx()}
                    </Badge>
                  </DataListValue>
                </DataListItem>
              )}
            </Show>
          </DataListRoot>
        )}
      </Show>
    </>
  );
};
