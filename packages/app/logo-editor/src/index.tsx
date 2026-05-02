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
  Text,
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

export const LogoEditor = () => {
  const actions = useLogoEditorActions();
  const setActiveTab = useAction(setTabAction);
  const [searchParams, setSearchParams] = useSearchParams<LogoSearchParams>();

  const readParam = (key: LogoSearchParamKey): string | undefined => {
    const value = searchParams[key];
    return typeof value === 'string' ? value : undefined;
  };

  // Hydrate from the URL on mount and on every navigation. Runs in an
  // effect so it executes after Solid hydration commits — synchronous
  // body-time mutations don't propagate through hydrated DOM, since
  // Solid binds reactive expressions to whatever the SSR HTML already
  // says. Build-time prerender always sees a query-less URL, so this
  // effect is the only place URL params actually land in state.
  createEffect(() => {
    const padParam = readParam('pad');
    actions.hydrate({
      icon: readParam('icon'),
      palette: readParam('palette'),
      shape: readParam('shape'),
      padding: padParam !== undefined ? Number(padParam) : undefined,
    });
  });

  // Mirror state → URL with a small debounce so each keystroke in the
  // padding slider doesn't generate its own history entry. `defer: true`
  // skips the immediate post-hydrate flush (URL would already match).
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const identity = <T,>(value: T) => value;
  createEffect(
    on(
      () => ({
        icon: logoEditor.icon.name,
        palette: logoEditor.palette,
        shape: logoEditor.shape,
        pad: logoEditor.padding,
      }),
      (next) => {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setSearchParams(
            {
              icon: paramOrNull(
                next.icon,
                DEFAULT_LOGO_EDITOR_STATE.icon.name,
                identity,
              ),
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
            },
            { replace: true },
          );
        }, URL_DEBOUNCE_MS);
      },
      { defer: true },
    ),
  );
  onCleanup(() => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  });

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
            onClick={actions.reset}
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
            onClick={actions.randomize}
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
              <Flex as="div" direction="column" gap={2} grow>
                <Flex
                  as="div"
                  align="baseline"
                  justify="between"
                  class={css.sectionRow}
                >
                  <Text
                    as="span"
                    size={1}
                    color="lowContrast"
                    selectable={false}
                  >
                    MDI
                  </Text>
                  <Text
                    as="span"
                    size={1}
                    color="lowContrast"
                    class={css.sectionMeta}
                    selectable={false}
                  >
                    {logoEditor.icon.name}
                  </Text>
                </Flex>
                <IconGrid
                  selected={logoEditor.icon}
                  onSelect={actions.setIcon}
                />
              </Flex>
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
