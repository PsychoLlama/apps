import { For, createEffect, on, onCleanup } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import { createStore, defineAction, defineStore, useAction } from '@lib/state';
import { SiteHeader } from '@lib/shell';
import {
  Button,
  Flex,
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
} from '@lib/ui';
import IconDice from 'virtual:icons/mdi/dice-multiple-outline';
import IconReset from 'virtual:icons/mdi/restart';
import { ExportActions } from './components/export-actions';
import { Field } from './components/field';
import { IconGrid } from './components/icon-grid';
import { InlineField } from './components/inline-field';
import { PaddingSlider } from './components/padding-slider';
import { PalettePicker } from './components/palette-picker';
import { Preview } from './components/preview';
import { ShapeSelector } from './components/shape-selector';
import {
  encodeIconRef,
  loadIconPackIndex,
  loadIconPackManifest,
  loadIconPage,
  parseIconRef,
  resolveIconRef,
  toIconRef,
  type IconRef,
} from './icons';
import {
  DEFAULT_ICON_EDITOR_STATE,
  iconEditor,
  useIconEditorActions,
} from './state';
import * as css from './index.css';

type InspectorTab = 'icon' | 'style' | 'export';

const TABS: ReadonlyArray<{ id: InspectorTab; label: string }> = [
  { id: 'icon', label: 'Icon' },
  { id: 'style', label: 'Style' },
  { id: 'export', label: 'Export' },
];

const tabStore = defineStore<{ tab: InspectorTab }>(() => ({ tab: 'icon' }));
const tabState = createStore(tabStore);
const setTabAction = defineAction([tabStore], (state, tab: string) => {
  if (tab === 'icon' || tab === 'style' || tab === 'export') state.tab = tab;
});

/**
 * Count of in-flight icon resolutions — URL hydration, randomize.
 * Counter (rather than a boolean) so concurrent requests stop pulsing
 * the canvas only once *every* request has settled.
 */
const loadingStore = defineStore<{ pending: number }>(() => ({ pending: 0 }));
const loadingState = createStore(loadingStore);
const startLoadingAction = defineAction([loadingStore], (state) => {
  state.pending += 1;
});
const finishLoadingAction = defineAction([loadingStore], (state) => {
  state.pending = Math.max(0, state.pending - 1);
});

/** Recognized search-param keys backing a shareable icon URL. */
type IconSearchParamKey = 'icon' | 'palette' | 'shape' | 'pad';

/** Search-param shape — index signature satisfies router's `SearchParams`. */
type IconSearchParams = Partial<Record<IconSearchParamKey, string>> &
  Record<string, string | string[] | undefined>;

/**
 * Mirror payload for `setSearchParams`. `null` is router idiom for
 * "delete this key"; an omitted key means "preserve whatever's
 * already in the URL." The extra `null` slot is what the runtime
 * accepts but the public `SearchParams` type doesn't model.
 */
type IconMirrorParams = Partial<Record<IconSearchParamKey, string | null>>;

/** Pause before flushing state changes to the URL. */
const URL_DEBOUNCE_MS = 200;

/**
 * Param-or-null tuple for `setSearchParams`. Returns `null` when the
 * value matches the canonical default so the URL stays clean at rest.
 */
const paramOrNull = <T,>(
  value: T,
  fallback: T,
  encode: (value: T) => string,
) => (value === fallback ? null : encode(value));

/**
 * Roll a random icon by walking the pack catalog: pick a pack, pick a
 * page, pick an entry. Loads everything on demand so we never have to
 * keep the full catalog in memory.
 */
const pickRandomIcon = async (): Promise<IconRef | undefined> => {
  const packs = await loadIconPackIndex();
  if (packs.length === 0) return undefined;
  const pack = packs[Math.floor(Math.random() * packs.length)];
  const manifest = await loadIconPackManifest(pack);
  if (manifest.pages.length === 0) return undefined;
  const pageIndex = Math.floor(Math.random() * manifest.pages.length);
  const page = await loadIconPage(pack.id, manifest.pages[pageIndex]);
  if (page.length === 0) return undefined;
  const entry = page[Math.floor(Math.random() * page.length)];
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

export const IconEditor = () => {
  const actions = useIconEditorActions();
  const setActiveTab = useAction(setTabAction);
  const startLoading = useAction(startLoadingAction);
  const finishLoading = useAction(finishLoadingAction);
  const isLoading = () => loadingState.pending > 0;
  const [searchParams, setSearchParams] = useSearchParams<IconSearchParams>();

  const readParam = (key: IconSearchParamKey): string | undefined => {
    const value = searchParams[key];
    return typeof value === 'string' ? value : undefined;
  };

  // Hydrate from the URL on mount and on every navigation. Style
  // fields apply synchronously; the icon param requires a pack
  // fetch, so it's resolved in the background. While the resolution
  // is in flight, the store's icon stays at whatever it was —
  // touching it would let the URL-mirror effect race ahead and
  // overwrite the URL's icon param with the placeholder default.
  //
  // `pendingIconRequest` is the request token of the most recent
  // in-flight resolution. The URL-mirror effect skips writing the
  // icon param while pending, and the wrapper `setIcon`/`reset`
  // helpers clear it whenever the user takes deliberate action so
  // their pick lands in the URL even if the original async fetch is
  // still resolving.
  let pendingIconRequest: string | undefined;
  const setIcon = (icon: IconRef) => {
    pendingIconRequest = undefined;
    actions.setIcon(icon);
  };
  const resetState = () => {
    pendingIconRequest = undefined;
    actions.reset();
  };
  createEffect(() => {
    const padParam = readParam('pad');
    const iconParam = readParam('icon');
    // `hydrate` only touches style fields — the icon is hydrated
    // separately through the async path below (or the explicit reset
    // in the else branch). Mixing them would either flash the icon
    // back to `undefined` for the few microtasks before
    // `resolveIconRef` finishes, or — if we tried to thread the
    // current icon through — create a reactive cycle on every pick.
    actions.hydrate({
      palette: readParam('palette'),
      shape: readParam('shape'),
      padding: padParam !== undefined ? Number(padParam) : undefined,
    });
    if (iconParam) {
      const parsed = parseIconRef(iconParam);
      if (parsed) {
        pendingIconRequest = iconParam;
        const requestToken = iconParam;
        startLoading();
        void resolveIconRef(parsed.pack, parsed.name).then((icon) => {
          finishLoading();
          if (pendingIconRequest !== requestToken) return;
          pendingIconRequest = undefined;
          if (icon) actions.setIcon(icon);
        });
        return;
      }
    }
    // No icon param (or malformed) — drop any pending hydration and
    // clear the icon. Style fields already reset via `actions.hydrate`.
    pendingIconRequest = undefined;
    actions.setIcon(DEFAULT_ICON_EDITOR_STATE.icon);
  });

  // Mirror state → URL with a small debounce so each keystroke in the
  // padding slider doesn't generate its own history entry. `defer: true`
  // skips the immediate post-hydrate flush (URL would already match).
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const identity = <T,>(value: T) => value;
  createEffect(
    on(
      () => ({
        icon: encodeIconRef(iconEditor.icon),
        palette: iconEditor.palette,
        shape: iconEditor.shape,
        pad: iconEditor.padding,
      }),
      (next) => {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          // While an icon resolution is pending we omit the `icon`
          // key — `setSearchParams` preserves omitted keys, so the
          // URL's existing icon param survives until the async
          // resolve lands and the user-driven flush below writes
          // the resolved value.
          const params: IconMirrorParams = {
            palette: paramOrNull(
              next.palette,
              DEFAULT_ICON_EDITOR_STATE.palette,
              identity,
            ),
            shape: paramOrNull(
              next.shape,
              DEFAULT_ICON_EDITOR_STATE.shape,
              identity,
            ),
            pad: paramOrNull(
              next.pad,
              DEFAULT_ICON_EDITOR_STATE.padding,
              String,
            ),
          };
          if (!pendingIconRequest) {
            params.icon = paramOrNull(
              next.icon,
              encodeIconRef(DEFAULT_ICON_EDITOR_STATE.icon),
              identity,
            );
          }
          // `null` is the router's runtime sentinel for "delete this
          // key"; the param type lets it through.
          setSearchParams(params, { replace: true });
        }, URL_DEBOUNCE_MS);
      },
      { defer: true },
    ),
  );
  onCleanup(() => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  });

  const handleRandomize = () => {
    actions.randomizeStyle();
    startLoading();
    void pickRandomIcon().then((icon) => {
      finishLoading();
      if (icon) setIcon(icon);
    });
  };

  return (
    <Flex as="main" direction="column" grow>
      <SiteHeader title="Icon Editor" />

      <Flex as="div" direction="column" class={css.workspace}>
        <Flex
          as="header"
          align="center"
          gap={1}
          class={css.toolbar}
          aria-label="Quick actions"
        >
          <Button
            testId="reset"
            size={1}
            variant="ghost"
            color="neutral"
            mx={2}
            my={1}
            onClick={resetState}
          >
            <IconReset aria-hidden /> Reset
          </Button>
          <Button
            testId="randomize"
            size={1}
            variant="ghost"
            color="neutral"
            mx={2}
            my={1}
            onClick={handleRandomize}
          >
            <IconDice aria-hidden /> Randomize
          </Button>
        </Flex>

        <Flex as="div" class={css.body}>
          <Flex as="section" class={css.canvas} aria-label="Icon preview">
            <Flex as="div" class={css.canvasStage}>
              <Preview state={iconEditor} size={296} loading={isLoading()} />
            </Flex>
          </Flex>

          <TabsRoot
            testId="icon-editor-inspector"
            value={tabState.tab}
            onValueChange={setActiveTab}
            class={css.rail}
            aria-label="Inspector"
          >
            <TabsList
              testId="icon-editor-inspector-list"
              justify="center"
              aria-label="Inspector sections"
            >
              <For each={TABS}>
                {(tab) => (
                  <TabsTrigger
                    testId={`icon-editor-inspector-trigger-${tab.id}`}
                    value={tab.id}
                  >
                    {tab.label}
                  </TabsTrigger>
                )}
              </For>
            </TabsList>

            <TabsContent
              testId="icon-editor-inspector-panel-icon"
              value="icon"
              class={`${css.tabPanel} ${css.tabPanelGrow}`}
            >
              <IconGrid selected={iconEditor.icon} onSelect={setIcon} />
            </TabsContent>

            <TabsContent
              testId="icon-editor-inspector-panel-style"
              value="style"
              class={css.tabPanel}
            >
              <Flex as="div" direction="column" gap={3}>
                <Field label="Palette">
                  <PalettePicker
                    value={iconEditor.palette}
                    onChange={actions.setPalette}
                  />
                </Field>
                <InlineField label="Shape">
                  <ShapeSelector
                    value={iconEditor.shape}
                    onChange={actions.setShape}
                  />
                </InlineField>
                <InlineField label="Padding">
                  <PaddingSlider
                    value={iconEditor.padding}
                    onInput={actions.setPadding}
                  />
                </InlineField>
              </Flex>
            </TabsContent>

            <TabsContent
              testId="icon-editor-inspector-panel-export"
              value="export"
              class={css.tabPanel}
            >
              <ExportActions state={iconEditor} />
            </TabsContent>
          </TabsRoot>
        </Flex>
      </Flex>
    </Flex>
  );
};
