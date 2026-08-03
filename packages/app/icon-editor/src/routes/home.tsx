import { Match, Switch, createEffect, on, onCleanup } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import { useAnchor, useCommit, useRun, useValue } from '@lib/state';
import { Frame, SiteHeader } from '@lib/shell';
import { Flex } from '@lib/ui';
import { IconGrid } from '../components/icon-grid';
import {
  activePackFormula,
  pickerScope,
  pickerViewChangedTopic,
} from '../components/icon-grid/store';
import { Preview } from '../components/preview';
import { PropertiesPanel } from '../components/properties-panel';
import {
  hydrateFromUrlSaga,
  randomizeIconSaga,
  selectPackSaga,
  type IconEditorUrlParams,
} from '../sagas';
import {
  editorResetTopic,
  iconEditorScope,
  iconEditorStore,
  iconPickedTopic,
  loadingStore,
  paddingChangedTopic,
  paletteChangedTopic,
  pickerClosedTopic,
  pickerOpenedTopic,
  railStore,
  shapeChangedTopic,
  shareParamsFormula,
} from '../store';
import type { IconRef } from '../icons';
import * as css from './home.css';

/** Recognized search-param keys backing a shareable icon URL. */
type IconSearchParamKey = 'icon' | 'palette' | 'shape' | 'pad';

/** Search-param shape — index signature satisfies router's `SearchParams`. */
type IconSearchParams = Partial<Record<IconSearchParamKey, string>> &
  Record<string, string | string[] | undefined>;

/** Pause before flushing state changes to the URL. */
const URL_DEBOUNCE_MS = 200;

const IconEditor = () => {
  useAnchor(iconEditorScope);
  useAnchor(pickerScope);

  const editor = useValue(iconEditorStore);
  const load = useValue(loadingStore);
  const rail = useValue(railStore);
  const pack = useValue(activePackFormula);
  const params = useValue(shareParamsFormula);

  const commit = useCommit();
  const hydrate = useRun(hydrateFromUrlSaga);
  const randomize = useRun(randomizeIconSaga);
  const choosePack = useRun(selectPackSaga);

  const [searchParams, setSearchParams] = useSearchParams<IconSearchParams>();

  // --- Router bridges ---
  //
  // The router is the one thing outside the state system that both
  // produces events and consumes state, so it gets two adapters. Every
  // decision in between — validating params, superseding stale fetches,
  // choosing which keys the URL should carry — lives in `sagas.ts` and
  // `store.ts`; these two effects only move values across the boundary.

  const readParam = (key: IconSearchParamKey): string | undefined => {
    const value = searchParams[key];
    return typeof value === 'string' ? value : undefined;
  };

  // URL → facts, on mount and on every navigation.
  createEffect(() => {
    const padParam = readParam('pad');
    const next: IconEditorUrlParams = {
      icon: readParam('icon'),
      palette: readParam('palette'),
      shape: readParam('shape'),
      padding: padParam !== undefined ? Number(padParam) : undefined,
    };
    void hydrate(next);
  });

  // State → URL, debounced so a padding drag doesn't write a history
  // entry per frame. `defer: true` skips the post-hydrate flush, where
  // the URL already matches what we just read from it.
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

  // "Choose pack" opens the pack list; "Choose icon" jumps straight to
  // the active pack's grid. Each lands as one transition across both
  // the rail and the picker.
  const handleChoosePack = () =>
    commit(pickerViewChangedTopic('packs'), pickerOpenedTopic());

  const handleChooseIcon = () =>
    commit(pickerViewChangedTopic('pack-detail'), pickerOpenedTopic());

  // Committing a pick returns the rail to the properties inspector so
  // the chosen icon, its style, and export land back in one view.
  const handlePick = (icon: IconRef) =>
    commit(iconPickedTopic(icon), pickerClosedTopic());

  return (
    <Frame>
      <SiteHeader title="Icon Editor" />

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
              <Match when={rail().view === 'properties'}>
                <PropertiesPanel
                  state={editor()}
                  activePack={pack()}
                  onPalette={(name) => commit(paletteChangedTopic(name))}
                  onShape={(shape) => commit(shapeChangedTopic(shape))}
                  onPadding={(value) => commit(paddingChangedTopic(value))}
                  onChoosePack={handleChoosePack}
                  onChooseIcon={handleChooseIcon}
                  onRandomize={() => void randomize()}
                  onReset={() => commit(editorResetTopic())}
                />
              </Match>
              <Match when={rail().view === 'picker'}>
                <IconGrid
                  selected={editor().icon}
                  onSelect={handlePick}
                  onSelectPack={(packId) => void choosePack(packId)}
                  onClose={() => commit(pickerClosedTopic())}
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
