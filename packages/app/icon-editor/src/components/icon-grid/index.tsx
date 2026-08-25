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
  onMount,
} from 'solid-js';
import type { Component } from 'solid-js';
import { useCommit, useRun, useValue } from '@lib/state';
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
  toIconRef,
  type IconEntry,
  type IconPackManifest,
  type IconPackSummary,
  type IconRef,
} from '../../icons';
import {
  activePackFormula,
  entryKey,
  iconEntryCacheFormula,
  loadMissingPackDataSaga,
  missingPackDataFormula,
  packSearchChangedTopic,
  pageChangedTopic,
  pageViewFormula,
  pickerStore,
  pickerViewChangedTopic,
  searchChangedTopic,
} from '../../state/picker';
import { PackCard } from '../pack-card';
import * as css from './icon-grid.css';

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
  const picker = useValue(pickerStore);
  const pack = useValue(activePackFormula);
  const missing = useValue(missingPackDataFormula);
  const commit = useCommit();
  const loadMissing = useRun(loadMissingPackDataSaga);

  // The editor fetches the pack catalog and folds every icon write into
  // the active pack, so both are already arranged by the time the grid
  // mounts. Pagination, the filter, and the entry cache are derived in
  // `store.ts` — this component only memoizes them for render.

  /**
   * The current slice. One memo over the whole derivation so a search
   * keystroke walks the (proxied) name array once, not once per field
   * the render reads.
   */
  const view = createMemo(useValue(pageViewFormula));

  /**
   * The entry cache. `equals: false` because the `Map` reference is
   * stable across chunk arrivals — the version counter inside the
   * formula is what actually changed. Tiles walk the `Map` directly,
   * with no tracking node per `pack:name` key.
   */
  const entries = createMemo(useValue(iconEntryCacheFormula), undefined, {
    equals: false,
  });

  // The picker's only fetch trigger: whatever the current view needs
  // and state doesn't hold. Every path that moves the pack, the filter,
  // or the page converges here, so none of them has to remember to
  // start its own request.
  createEffect(() => void loadMissing(missing()));

  const getEntry = (packId: string, name: string): IconEntry | undefined =>
    entries().get(entryKey(packId, name));

  const handlePickIcon = (manifest: IconPackManifest, name: string) => {
    const entry = getEntry(manifest.id, name);
    if (!entry) return;
    const summary = pack();
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
        <Match when={picker().view === 'packs'}>
          <PackListView
            packs={picker().packs}
            activePackId={picker().activePackId}
            search={picker().packSearch}
            onSearch={(query) => commit(packSearchChangedTopic(query))}
            onPick={props.onSelectPack}
            onClose={props.onClose}
          />
        </Match>
        <Match when={picker().view === 'pack-detail'}>
          <PackDetailView
            pack={pack()}
            manifest={view().manifest}
            getEntry={getEntry}
            search={picker().search}
            onSearch={(query) => commit(searchChangedTopic(query))}
            visible={view().names}
            pageStart={view().start}
            total={view().total}
            currentPage={view().page}
            pageCount={view().pageCount}
            onPageChange={(page) => commit(pageChangedTopic(page))}
            selected={props.selected}
            onPickIcon={handlePickIcon}
            onClose={props.onClose}
            onShowInfo={() => commit(pickerViewChangedTopic('pack-info'))}
          />
        </Match>
        <Match when={picker().view === 'pack-info'}>
          <PackInfoView
            pack={pack()}
            onShowIcons={() => commit(pickerViewChangedTopic('pack-detail'))}
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
