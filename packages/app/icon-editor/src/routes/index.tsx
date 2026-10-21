import {
  Match,
  Switch,
  createEffect,
  createMemo,
  on,
  onCleanup,
  untrack,
} from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import { useAction, useValue } from '@lib/effects/solid';
import { Frame, SiteHeader } from '@lib/shell';
import { Flex } from '@lib/ui';
import { IconGrid } from '../components/icon-grid';
import { Preview } from '../components/preview';
import { PropertiesPanel } from '../components/properties-panel';
import { $randomizeIcon, $resolveIconParam } from '../effects';
import { resolveStyleHydration } from '../hydration';
import {
  $editor,
  $editorLifetime,
  $editorReset,
  $iconPicked,
  $loading,
  $packChosen,
  $paddingChanged,
  $paletteChanged,
  $picker,
  $pickerClosed,
  $pickerOpened,
  $rail,
  $shapeChanged,
  $urlHydrated,
  activePackOf,
  shareParamsOf,
} from '../state';
import * as css from './index.css';

/** Recognized search-param keys backing a shareable icon URL. */
type IconSearchParamKey = 'icon' | 'palette' | 'shape' | 'pad';

/** Search-param shape — index signature satisfies router's `SearchParams`. */
type IconSearchParams = Partial<Record<IconSearchParamKey, string>> &
  Record<string, string | string[] | undefined>;

/** Pause before flushing state changes to the URL. */
const URL_DEBOUNCE_MS = 200;

const IconEditor = () => {
  useValue($editorLifetime);

  const editor = useValue($editor);
  const load = useValue($loading);
  const rail = useValue($rail);
  const picker = useValue($picker);

  const urlHydrated = useAction($urlHydrated);
  const resolveIconParam = useAction($resolveIconParam);
  const randomize = useAction($randomizeIcon);
  const pickIcon = useAction($iconPicked);
  const choosePack = useAction($packChosen);
  const openPicker = useAction($pickerOpened);
  const closePicker = useAction($pickerClosed);
  const changePalette = useAction($paletteChanged);
  const changeShape = useAction($shapeChanged);
  const changePadding = useAction($paddingChanged);
  const reset = useAction($editorReset);

  const [searchParams, setSearchParams] = useSearchParams<IconSearchParams>();

  // --- Router bridges ---
  //
  // The router is the one thing outside the state system that both
  // produces events and consumes state, so it gets two adapters. Every
  // decision in between — validating params, superseding stale fetches,
  // choosing which keys the URL should carry — lives in `state/` and
  // `effects/`; these two effects only move values across the boundary.

  const readParam = (key: IconSearchParamKey): string | undefined => {
    const value = searchParams[key];
    return typeof value === 'string' ? value : undefined;
  };

  // URL → state, on mount and on every navigation. Untracked, so only the
  // params re-run it, never what the handlers read.
  createEffect(() => {
    const icon = readParam('icon');
    const padParam = readParam('pad');
    const style = resolveStyleHydration({
      palette: readParam('palette'),
      shape: readParam('shape'),
      padding: padParam !== undefined ? Number(padParam) : undefined,
    });

    untrack(() => {
      urlHydrated(style, icon);
      resolveIconParam(icon);
    });
  });

  // State → URL, debounced so a padding drag doesn't write a history
  // entry per frame. `defer: true` skips the post-hydrate flush, where
  // the URL already matches what we just read from it.
  const params = createMemo(() => shareParamsOf(editor(), load()));
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  createEffect(
    on(
      params,
      (next) => {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setSearchParams(next, { replace: true });
        }, URL_DEBOUNCE_MS);
      },
      { defer: true },
    ),
  );
  onCleanup(() => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  });

  return (
    <Frame>
      <SiteHeader />

      <Flex as="div" direction="column" class={css.workspace}>
        <Flex as="div" class={css.body}>
          <Flex as="section" class={css.canvas} aria-label="Icon preview">
            <Flex as="div" class={css.canvasStage}>
              <Preview
                state={editor()}
                size={296}
                loading={load().pending > 0}
              />
            </Flex>
          </Flex>

          <Flex
            as="aside"
            direction="column"
            class={css.rail}
            aria-label="Editor panel"
          >
            <Switch>
              <Match when={rail() === 'properties'}>
                <PropertiesPanel
                  state={editor()}
                  activePack={activePackOf(picker())}
                  onPalette={changePalette}
                  onShape={changeShape}
                  onPadding={changePadding}
                  onChoosePack={() => openPicker('packs')}
                  onChooseIcon={() => openPicker('pack-detail')}
                  onRandomize={() => randomize()}
                  onReset={() => reset()}
                />
              </Match>
              <Match when={rail() === 'picker'}>
                <IconGrid
                  selected={editor().icon}
                  onSelect={pickIcon}
                  onSelectPack={choosePack}
                  onClose={() => closePicker()}
                />
              </Match>
            </Switch>
          </Flex>
        </Flex>
      </Flex>
    </Frame>
  );
};

export default IconEditor;
