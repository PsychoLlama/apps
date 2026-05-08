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
import { Spec } from './components/spec';
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
  DEFAULT_LOGO_EDITOR_STATE,
  logoEditor,
  useLogoEditorActions,
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

/** Recognized search-param keys backing a shareable logo URL. */
type LogoSearchParamKey = 'icon' | 'palette' | 'shape' | 'pad';

/** Search-param shape — index signature satisfies router's `SearchParams`. */
type LogoSearchParams = Partial<Record<LogoSearchParamKey, string>> &
  Record<string, string | string[] | undefined>;

/**
 * Mirror payload for `setSearchParams`. `null` is router idiom for
 * "delete this key"; an omitted key means "preserve whatever's
 * already in the URL." The extra `null` slot is what the runtime
 * accepts but the public `SearchParams` type doesn't model.
 */
type LogoMirrorParams = Partial<Record<LogoSearchParamKey, string | null>>;

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
  return toIconRef(manifest, entry);
};

export const LogoEditor = () => {
  const actions = useLogoEditorActions();
  const setActiveTab = useAction(setTabAction);
  const [searchParams, setSearchParams] = useSearchParams<LogoSearchParams>();

  const readParam = (key: LogoSearchParamKey): string | undefined => {
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
    // Pass the current icon through so style hydration doesn't
    // overwrite it with `DEFAULT_ICON` (mdi:home). The icon resolves
    // asynchronously below; while that's pending we want to keep
    // whatever the store already had — otherwise every URL flush
    // (debounced ~200 ms after each pick) flashes the picker back to
    // MDI for the few microtasks `resolveIconRef` takes to finish.
    actions.hydrate({
      icon: logoEditor.icon,
      palette: readParam('palette'),
      shape: readParam('shape'),
      padding: padParam !== undefined ? Number(padParam) : undefined,
    });
    if (iconParam) {
      const parsed = parseIconRef(iconParam);
      if (parsed) {
        pendingIconRequest = iconParam;
        const requestToken = iconParam;
        void resolveIconRef(parsed.pack, parsed.name).then((icon) => {
          if (pendingIconRequest !== requestToken) return;
          pendingIconRequest = undefined;
          if (icon) actions.setIcon(icon);
        });
        return;
      }
    }
    // No icon param (or malformed) — drop any pending hydration and
    // reset the icon. Style fields already reset via `actions.hydrate`.
    pendingIconRequest = undefined;
    actions.setIcon(DEFAULT_LOGO_EDITOR_STATE.icon);
  });

  // Mirror state → URL with a small debounce so each keystroke in the
  // padding slider doesn't generate its own history entry. `defer: true`
  // skips the immediate post-hydrate flush (URL would already match).
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const identity = <T,>(value: T) => value;
  createEffect(
    on(
      () => ({
        icon: encodeIconRef(logoEditor.icon),
        palette: logoEditor.palette,
        shape: logoEditor.shape,
        pad: logoEditor.padding,
      }),
      (next) => {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          // While an icon resolution is pending we omit the `icon`
          // key — `setSearchParams` preserves omitted keys, so the
          // URL's existing icon param survives until the async
          // resolve lands and the user-driven flush below writes
          // the resolved value.
          const params: LogoMirrorParams = {
            palette: paramOrNull(
              next.palette,
              DEFAULT_LOGO_EDITOR_STATE.palette,
              identity,
            ),
            shape: paramOrNull(
              next.shape,
              DEFAULT_LOGO_EDITOR_STATE.shape,
              identity,
            ),
            pad: paramOrNull(
              next.pad,
              DEFAULT_LOGO_EDITOR_STATE.padding,
              String,
            ),
          };
          if (!pendingIconRequest) {
            params.icon = paramOrNull(
              next.icon,
              encodeIconRef(DEFAULT_LOGO_EDITOR_STATE.icon),
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
    void pickRandomIcon().then((icon) => {
      if (icon) setIcon(icon);
    });
  };

  return (
    <Flex as="main" direction="column" grow>
      <SiteHeader title="Logo Editor" />

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
          <Flex as="section" class={css.canvas} aria-label="Logo preview">
            <Flex as="div" class={css.canvasStage}>
              <Preview state={logoEditor} size={296} />
            </Flex>
          </Flex>

          <TabsRoot
            testId="logo-editor-inspector"
            value={tabState.tab}
            onValueChange={setActiveTab}
            class={css.rail}
            aria-label="Inspector"
          >
            <TabsList
              testId="logo-editor-inspector-list"
              justify="center"
              aria-label="Inspector sections"
            >
              <For each={TABS}>
                {(tab) => (
                  <TabsTrigger
                    testId={`logo-editor-inspector-trigger-${tab.id}`}
                    value={tab.id}
                  >
                    {tab.label}
                  </TabsTrigger>
                )}
              </For>
            </TabsList>

            <TabsContent
              testId="logo-editor-inspector-panel-icon"
              value="icon"
              class={`${css.tabPanel} ${css.tabPanelGrow}`}
            >
              <IconGrid selected={logoEditor.icon} onSelect={setIcon} />
            </TabsContent>

            <TabsContent
              testId="logo-editor-inspector-panel-style"
              value="style"
              class={css.tabPanel}
            >
              <Flex as="div" direction="column" gap={3}>
                <Field label="Palette">
                  <PalettePicker
                    value={logoEditor.palette}
                    onChange={actions.setPalette}
                  />
                </Field>
                <InlineField label="Shape">
                  <ShapeSelector
                    value={logoEditor.shape}
                    onChange={actions.setShape}
                  />
                </InlineField>
                <InlineField label="Padding">
                  <PaddingSlider
                    value={logoEditor.padding}
                    onInput={actions.setPadding}
                  />
                </InlineField>
              </Flex>
            </TabsContent>

            <TabsContent
              testId="logo-editor-inspector-panel-export"
              value="export"
              class={css.tabPanel}
            >
              <ExportActions state={logoEditor} />
            </TabsContent>
          </TabsRoot>
        </Flex>

        <Flex as="footer" class={css.statusBar} aria-label="Status">
          <Spec state={logoEditor} variant="plain" />
        </Flex>
      </Flex>
    </Flex>
  );
};
