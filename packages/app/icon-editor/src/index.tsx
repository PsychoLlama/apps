import { For, createEffect, on, onCleanup, untrack } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import { useAction, useEffect } from '@lib/state';
import { Frame, SiteHeader } from '@lib/shell';
import {
  Button,
  Flex,
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
} from '@lib/ui';
import IconShuffle from 'virtual:icons/mdi/shuffle-variant';
import IconReset from 'virtual:icons/mdi/restart';
import { ExportActions } from './components/export-actions';
import { Field } from './components/field';
import { IconGrid } from './components/icon-grid';
import { InlineField } from './components/inline-field';
import { PaddingSlider } from './components/padding-slider';
import { PalettePicker } from './components/palette-picker';
import { Preview } from './components/preview';
import { ShapeSelector } from './components/shape-selector';
import { encodeIconRef, parseIconRef } from './icons';
import {
  hydrateStyle as hydrateStyleAction,
  randomizeIconEffect,
  randomizeStyleEffect,
  reset as resetAction,
  resolveIconEffect,
  setIcon as setIconAction,
  setInspectorTab as setInspectorTabAction,
  setPadding as setPaddingAction,
  setPalette as setPaletteAction,
  setShape as setShapeAction,
} from './bindings';
import {
  DEFAULT_ICON_EDITOR_STATE,
  iconEditor,
  inspector,
  loading,
  type InspectorTab,
} from './store';
import * as css from './index.css';

const TABS: ReadonlyArray<{ id: InspectorTab; label: string }> = [
  { id: 'icon', label: 'Icon' },
  { id: 'style', label: 'Style' },
  { id: 'export', label: 'Export' },
];

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

const identity = <T,>(value: T) => value;

const isInspectorTab = (value: string): value is InspectorTab =>
  value === 'icon' || value === 'style' || value === 'export';

export const IconEditor = () => {
  const setIcon = useAction(setIconAction);
  const setPalette = useAction(setPaletteAction);
  const setShape = useAction(setShapeAction);
  const setPadding = useAction(setPaddingAction);
  const reset = useAction(resetAction);
  const hydrateStyle = useAction(hydrateStyleAction);
  const setInspectorTab = useAction(setInspectorTabAction);
  const randomizeStyle = useEffect(randomizeStyleEffect);
  const randomizeIcon = useEffect(randomizeIconEffect);
  const resolveIcon = useEffect(resolveIconEffect);
  const [searchParams, setSearchParams] = useSearchParams<IconSearchParams>();

  const readParam = (key: IconSearchParamKey): string | undefined => {
    const value = searchParams[key];
    return typeof value === 'string' ? value : undefined;
  };

  // Hydrate from the URL on mount and on every navigation. Style
  // fields apply synchronously; the icon param requires a pack fetch,
  // dispatched through `resolveIconEffect` so loading + supersession
  // bookkeeping land in the store.
  //
  // `lastIconParam` records the `icon` value seen on the previous
  // run so the "no icon" branch can distinguish a deliberate URL
  // clear from a URL-mirror echo of an unchanged absent param. The
  // latter happens every Randomize: style fields update first, the
  // mirror omits `icon` while the random fetch is pending, and the
  // resulting navigation arrives back here with no icon param. If we
  // unconditionally called `setIcon(undefined)` then, the pending
  // resolve would be superseded and the user would land with new
  // styles but no icon.
  let lastIconParam: string | undefined;
  createEffect(() => {
    const padParam = readParam('pad');
    const iconParam = readParam('icon');
    hydrateStyle({
      palette: readParam('palette'),
      shape: readParam('shape'),
      padding: padParam !== undefined ? Number(padParam) : undefined,
    });
    if (iconParam) {
      lastIconParam = iconParam;
      const parsed = parseIconRef(iconParam);
      if (!parsed) return;
      // Skip when the param already matches what we hold — the
      // URL-mirror effect echoes every icon write back into the
      // search params and retriggers this effect; without the
      // short-circuit every pick spends a fetch round-trip (and a
      // loading pulse) on a no-op refresh. `untrack` keeps that
      // comparison from making `iconEditor.icon` a dependency.
      const current = untrack(() => iconEditor.icon);
      if (current?.pack === parsed.pack && current.name === parsed.name) {
        return;
      }
      void resolveIcon({ pack: parsed.pack, name: parsed.name });
      return;
    }
    const previouslyHadIcon = lastIconParam !== undefined;
    lastIconParam = undefined;
    if (previouslyHadIcon) {
      setIcon(DEFAULT_ICON_EDITOR_STATE.icon);
    }
  });

  // Mirror state → URL with a small debounce so each keystroke in the
  // padding slider doesn't generate its own history entry. `defer: true`
  // skips the immediate post-hydrate flush (URL would already match).
  // Reading `loading.pending` lets the effect re-fire when a resolve
  // settles, flushing the freshly-applied icon to the URL.
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  createEffect(
    on(
      () => ({
        icon: encodeIconRef(iconEditor.icon),
        palette: iconEditor.palette,
        shape: iconEditor.shape,
        pad: iconEditor.padding,
        pending: loading.pending,
      }),
      (next) => {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          // While an icon resolution is pending we omit the `icon`
          // key — `setSearchParams` preserves omitted keys, so the
          // URL's existing icon param survives until the resolve
          // settles. A user pick zeroes `pending` immediately, so
          // their choice mirrors right away even if a stale fetch
          // is still in flight.
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
          if (next.pending === 0) {
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
    randomizeStyle();
    void randomizeIcon();
  };

  return (
    <Frame>
      <SiteHeader
        title="Icon Editor"
        actions={
          <Flex as="div" align="center" gap={4}>
            <Button
              testId="randomize"
              variant="ghost"
              color="neutral"
              onClick={handleRandomize}
            >
              <IconShuffle aria-hidden /> Shuffle
            </Button>
            <Button
              testId="reset"
              variant="ghost"
              color="neutral"
              onClick={reset}
            >
              <IconReset aria-hidden /> Reset
            </Button>
          </Flex>
        }
      />

      <Flex as="div" direction="column" class={css.workspace}>
        <Flex as="div" class={css.body}>
          <Flex as="section" class={css.canvas} aria-label="Icon preview">
            <Flex as="div" class={css.canvasStage}>
              <Preview
                state={iconEditor}
                size={296}
                loading={loading.pending > 0}
              />
            </Flex>
          </Flex>

          <TabsRoot
            testId="icon-editor-inspector"
            value={inspector.tab}
            onValueChange={(value) => {
              if (isInspectorTab(value)) setInspectorTab(value);
            }}
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
                    onChange={setPalette}
                  />
                </Field>
                <InlineField label="Shape">
                  <ShapeSelector value={iconEditor.shape} onChange={setShape} />
                </InlineField>
                <InlineField label="Padding">
                  <PaddingSlider
                    value={iconEditor.padding}
                    onInput={setPadding}
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
    </Frame>
  );
};
