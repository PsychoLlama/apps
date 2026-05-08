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
import { Flex, IconButton, Text, TextField } from '@lib/ui';
import IconBack from 'virtual:icons/mdi/arrow-left';
import IconClose from 'virtual:icons/mdi/close';
import IconSearch from 'virtual:icons/mdi/magnify';
import {
  loadIconPackIndex,
  loadIconPackManifest,
  loadIconPageEntries,
  type IconPackManifest,
  type IconPackSummary,
  type IconPageResult,
  type IconRef,
} from '../icons';
import * as css from './icon-grid.css';

/**
 * Cap the visible tile count so the DOM stays under ~250 SVGs even
 * when a pack contains thousands of icons. Refining the search is the
 * intended affordance once the grid hits the cap.
 */
const MAX_VISIBLE = 250;

type View = 'packs' | 'pack-detail';

interface PickerState {
  /** Which surface is showing — pack list or icon grid for one pack. */
  view: View;
  /** Pack id whose icons populate the detail grid. */
  activePackId: string;
  /** Current search filter applied to the active pack's name list. */
  search: string;
  /** Cached pack catalog — `undefined` until the index fetch resolves. */
  packs: ReadonlyArray<IconPackSummary> | undefined;
  /**
   * Per-pack manifests keyed by pack id. Plain record (not `Map`) so
   * solid-js/store's `createMutable` proxy notices the writes —
   * `Map` mutations bypass the proxy and never trigger downstream
   * memos.
   */
  manifests: { [packId: string]: IconPackManifest | undefined };
  /** Resolved icon SVG markup, keyed by `pack:name`. Plain record for the same reactivity reason as `manifests`. */
  bodies: { [key: string]: string | undefined };
}

const initialState = (): PickerState => ({
  view: 'pack-detail',
  activePackId: 'mdi',
  search: '',
  packs: undefined,
  manifests: {},
  bodies: {},
});

const pickerStore = defineStore<PickerState>(initialState);
const picker = createStore(pickerStore);

const bodyKey = (pack: string, name: string): string => `${pack}:${name}`;

const setViewAction = defineAction([pickerStore], (state, view: View) => {
  state.view = view;
});

const openPackAction = defineAction([pickerStore], (state, packId: string) => {
  state.activePackId = packId;
  state.search = '';
  state.view = 'pack-detail';
});

const setSearchAction = defineAction([pickerStore], (state, query: string) => {
  state.search = query;
});

const seedBodyAction = defineAction(
  [pickerStore],
  (state, ref: { pack: string; name: string; body: string }) => {
    state.bodies[bodyKey(ref.pack, ref.name)] = ref.body;
  },
);

const ingestPageAction = defineAction(
  [pickerStore],
  (state, ingest: IconPageResult) => {
    for (const entry of ingest.entries) {
      state.bodies[bodyKey(ingest.packId, entry.name)] = entry.body;
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
  const seedBody = useAction(seedBodyAction);
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

  // Keep the bodies map seeded with the currently selected icon —
  // even before the manifest loads, the picker knows it can render
  // the selected tile. URL hydration sometimes resolves an icon
  // outside the active pack's loaded pages.
  createEffect(() => {
    seedBody({
      pack: props.selected.pack,
      name: props.selected.name,
      body: props.selected.body,
    });
  });

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

  /** Filter applied against `manifest.names` — case-insensitive substring. */
  const filtered = createMemo<{
    visible: ReadonlyArray<string>;
    total: number;
  }>(() => {
    const manifest = activeManifest();
    if (!manifest) return { visible: [], total: 0 };
    const term = picker.search.trim().toLowerCase();
    const matches = term
      ? manifest.names.filter((name) => name.toLowerCase().includes(term))
      : manifest.names;
    return { visible: matches.slice(0, MAX_VISIBLE), total: matches.length };
  });

  // Whenever the visible set changes, request the page chunks needed
  // to render their bodies. `requestedUrls` lives in component scope —
  // `loadIconPage` itself caches at the module level, so all this Set
  // adds is a guard against re-firing the success action with bodies
  // we have already ingested.
  const requestedUrls = new Set<string>();
  createEffect(() => {
    const manifest = activeManifest();
    if (!manifest) return;
    const visible = filtered().visible;
    if (visible.length === 0) return;
    const needed = new Set<number>();
    for (const name of visible) {
      const position = manifest.names.indexOf(name);
      if (position < 0) continue;
      needed.add(Math.floor(position / manifest.pageSize));
    }
    for (const idx of needed) {
      const pageUrl = manifest.pages[idx];
      if (!pageUrl || requestedUrls.has(pageUrl)) continue;
      requestedUrls.add(pageUrl);
      void loadPage({ packId: manifest.id, pageUrl });
    }
  });

  const handlePickIcon = (manifest: IconPackManifest, name: string) => {
    const body = picker.bodies[bodyKey(manifest.id, name)];
    if (!body) return;
    props.onSelect({
      pack: manifest.id,
      name,
      body,
      width: manifest.width,
      height: manifest.height,
    });
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
            bodies={picker.bodies}
            search={picker.search}
            onSearch={setSearch}
            visible={filtered().visible}
            total={filtered().total}
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
                    {pack.total}
                  </Text>
                </Flex>
                <Flex as="div" align="center" gap={2}>
                  <For each={pack.samples}>
                    {(sample) => (
                      <svg
                        class={css.packSample}
                        viewBox={`0 0 ${pack.width} ${pack.height}`}
                        innerHTML={sample.body}
                      />
                    )}
                  </For>
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
  bodies: Readonly<Record<string, string | undefined>>;
  search: string;
  onSearch: (value: string) => void;
  visible: ReadonlyArray<string>;
  total: number;
  selected: IconRef;
  onPickIcon: (manifest: IconPackManifest, name: string) => void;
  onOpenPackList: () => void;
}

const PackDetailView: Component<PackDetailViewProps> = (props) => {
  const truncated = () => props.total > props.visible.length;

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
                  const body = () => props.bodies[bodyKey(manifest().id, name)];
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
                      disabled={!body()}
                      onClick={() => props.onPickIcon(manifest(), name)}
                    >
                      <Show
                        when={body()}
                        fallback={
                          // Skeleton block while the body fetches.
                          // eslint-disable-next-line custom/require-ui-primitives
                          <span class={css.tileSkeleton} aria-hidden />
                        }
                      >
                        {(svgBody) => (
                          <svg
                            class={css.tileIcon}
                            viewBox={`0 0 ${manifest().width} ${manifest().height}`}
                            innerHTML={svgBody()}
                          />
                        )}
                      </Show>
                    </button>
                  );
                }}
              </For>
            </div>
            <Show when={truncated()}>
              <Flex as="div" justify="center">
                <Text as="span" size={1} color="lowContrast" selectable={false}>
                  Showing {props.visible.length} of {props.total} — refine the
                  search to narrow.
                </Text>
              </Flex>
            </Show>
          </Show>
        )}
      </Show>
    </>
  );
};
