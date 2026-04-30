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
import {
  DEFAULT_FAVICON_STATE,
  ExportActions,
  Field,
  IconGrid,
  InlineField,
  PaddingSlider,
  PalettePicker,
  Preview,
  ShapeSelector,
  Spec,
  favicon,
  useFaviconActions,
} from '../features/favicon';
import * as css from './logo.css';

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

export default function LogoGenerator() {
  const actions = useFaviconActions();
  const setActiveTab = useAction(setTabAction);
  const [searchParams, setSearchParams] = useSearchParams<LogoSearchParams>();

  // Hydrate before any reactive setup. Solid runs the component body
  // exactly once per mount, so reading the search-params proxy here
  // doesn't subscribe — the effect below is what tracks state changes.
  const readParam = (key: LogoSearchParamKey): string | undefined => {
    const value = searchParams[key];
    return typeof value === 'string' ? value : undefined;
  };
  const padParam = readParam('pad');
  actions.hydrate({
    icon: readParam('icon'),
    palette: readParam('palette'),
    shape: readParam('shape'),
    padding: padParam !== undefined ? Number(padParam) : undefined,
  });

  // Mirror state → URL with a small debounce so each keystroke in the
  // padding slider doesn't generate its own history entry. `defer: true`
  // skips the immediate post-hydrate flush (URL would already match).
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const identity = <T,>(value: T) => value;
  createEffect(
    on(
      () => ({
        icon: favicon.icon.name,
        palette: favicon.palette,
        shape: favicon.shape,
        pad: favicon.padding,
      }),
      (next) => {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setSearchParams(
            {
              icon: paramOrNull(
                next.icon,
                DEFAULT_FAVICON_STATE.icon.name,
                identity,
              ),
              palette: paramOrNull(
                next.palette,
                DEFAULT_FAVICON_STATE.palette,
                identity,
              ),
              shape: paramOrNull(
                next.shape,
                DEFAULT_FAVICON_STATE.shape,
                identity,
              ),
              pad: paramOrNull(next.pad, DEFAULT_FAVICON_STATE.padding, String),
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
      <SiteHeader title="Logo Generator" />

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
              <Preview state={favicon} size={296} />
            </Flex>
          </Flex>

          <TabsRoot
            testId="logo-inspector"
            value={tabState.tab}
            onValueChange={setActiveTab}
            class={css.rail}
            aria-label="Inspector"
          >
            <TabsList
              testId="logo-inspector-list"
              justify="center"
              aria-label="Inspector sections"
            >
              <For each={TABS}>
                {(tab) => (
                  <TabsTrigger
                    testId={`logo-inspector-trigger-${tab.id}`}
                    value={tab.id}
                  >
                    {tab.label}
                  </TabsTrigger>
                )}
              </For>
            </TabsList>

            <TabsContent
              testId="logo-inspector-panel-icon"
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
                    {favicon.icon.name}
                  </Text>
                </Flex>
                <IconGrid selected={favicon.icon} onSelect={actions.setIcon} />
              </Flex>
            </TabsContent>

            <TabsContent
              testId="logo-inspector-panel-style"
              value="style"
              class={css.tabPanel}
            >
              <Flex as="div" direction="column" gap={3}>
                <Field label="Palette">
                  <PalettePicker
                    value={favicon.palette}
                    onChange={actions.setPalette}
                  />
                </Field>
                <InlineField label="Shape">
                  <ShapeSelector
                    value={favicon.shape}
                    onChange={actions.setShape}
                  />
                </InlineField>
                <InlineField label="Padding" for="logo-pad">
                  <PaddingSlider
                    inputId="logo-pad"
                    value={favicon.padding}
                    onInput={actions.setPadding}
                  />
                </InlineField>
              </Flex>
            </TabsContent>

            <TabsContent
              testId="logo-inspector-panel-export"
              value="export"
              class={css.tabPanel}
            >
              <ExportActions state={favicon} />
            </TabsContent>
          </TabsRoot>
        </Flex>

        <Flex as="footer" class={css.statusBar} aria-label="Status">
          <Spec state={favicon} variant="plain" />
        </Flex>
      </Flex>
    </Flex>
  );
}
