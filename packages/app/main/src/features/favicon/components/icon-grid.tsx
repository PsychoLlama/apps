/* eslint-disable solid/no-innerhtml -- icon bodies come from bundled
 * MDI source which we author and ship; there is no untrusted input. */

import { createMemo, For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import { createStore, defineAction, defineStore, useAction } from '@lib/state';
import { Flex, IconButton, Text, TextField } from '@lib/ui';
import IconSearch from 'virtual:icons/mdi/magnify';
import IconClose from 'virtual:icons/mdi/close';
import { ICONS, ICON_VIEWBOX, type IconEntry } from '../icons';
import * as css from './icon-grid.css';

interface SearchState {
  query: string;
}

const searchStore = defineStore<SearchState>(() => ({ query: '' }));
const search = createStore(searchStore);
const setQueryAction = defineAction([searchStore], (state, query: string) => {
  state.query = query;
});

interface IconGridProps {
  /** Currently selected icon — highlights the matching tile. */
  selected: IconEntry;
  /** Called when the user picks a different icon. */
  onSelect: (icon: IconEntry) => void;
  /** Optional CSS height applied to the scrollable grid area. */
  gridHeight?: string;
}

/** Searchable grid of MDI icons. */
export const IconGrid: Component<IconGridProps> = (props) => {
  const setQuery = useAction(setQueryAction);
  const filtered = createMemo(() => {
    const term = search.query.trim().toLowerCase();
    if (!term) return ICONS;
    return ICONS.filter((icon) => icon.name.includes(term));
  });

  return (
    <Flex as="div" direction="column" gap={3} grow class={css.root}>
      <TextField
        testId="icon-grid-search"
        type="search"
        placeholder="Search icons…"
        value={search.query}
        onInput={(event) => setQuery(event.currentTarget.value)}
        aria-label="Search icons"
        left={<IconSearch aria-hidden />}
        right={
          <Show when={search.query.length > 0}>
            <IconButton
              testId="icon-grid-search-clear"
              size={1}
              variant="ghost"
              color="neutral"
              aria-label="Clear search"
              onClick={() => setQuery('')}
            >
              <IconClose aria-hidden />
            </IconButton>
          </Show>
        }
      />
      <Show
        when={filtered().length > 0}
        fallback={
          <Flex as="div" justify="center" class={css.empty}>
            <Text as="span" size={2} color="lowContrast" selectable={false}>
              No icons match “{search.query}”
            </Text>
          </Flex>
        }
      >
        {/* CSS Grid with auto-fill columns has no @lib/ui equivalent. */}
        {/* eslint-disable-next-line custom/require-ui-primitives */}
        <div class={css.grid} style={{ height: props.gridHeight ?? '' }}>
          <For each={filtered()}>
            {(icon) => (
              // The tile is a custom-styled click target with no @lib/ui
              // analogue (Button enforces solid/soft/outline/ghost shapes).
              // eslint-disable-next-line custom/require-ui-primitives
              <button
                type="button"
                class={css.tile}
                classList={{
                  [css.tileActive]: props.selected.name === icon.name,
                }}
                title={icon.name}
                aria-label={icon.name}
                aria-pressed={props.selected.name === icon.name}
                onClick={() => props.onSelect(icon)}
              >
                <svg
                  class={css.tileIcon}
                  viewBox={`0 0 ${ICON_VIEWBOX.width} ${ICON_VIEWBOX.height}`}
                  innerHTML={icon.body}
                />
              </button>
            )}
          </For>
        </div>
      </Show>
    </Flex>
  );
};
