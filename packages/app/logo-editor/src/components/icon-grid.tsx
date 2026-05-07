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

/**
 * Cap the visible tile count so the DOM stays under ~250 SVGs even
 * when the search yields thousands of matches. Beyond a few hundred
 * tiles the grid is unscannable anyway — refining the query is the
 * intended affordance.
 */
const MAX_VISIBLE = 250;

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

interface FilterResult {
  /** Tiles that should render. Capped at {@link MAX_VISIBLE}. */
  visible: ReadonlyArray<IconEntry>;
  /** Total icons matching the current query, ignoring the visible cap. */
  total: number;
}

/** Searchable grid of MDI icons. */
export const IconGrid: Component<IconGridProps> = (props) => {
  const setQuery = useAction(setQueryAction);
  const filtered = createMemo<FilterResult>(() => {
    const term = search.query.trim().toLowerCase();
    const matches = term
      ? ICONS.filter((icon) => icon.name.includes(term))
      : ICONS;
    return { visible: matches.slice(0, MAX_VISIBLE), total: matches.length };
  });
  const truncated = () => filtered().total > filtered().visible.length;

  return (
    <Flex as="div" direction="column" gap={3} grow class={css.root}>
      <TextField
        testId="icon-grid-search"
        type="search"
        placeholder="Search icons…"
        autocomplete="off"
        autocapitalize="none"
        enterkeyhint="search"
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
        when={filtered().total > 0}
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
          <For each={filtered().visible}>
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
        <Show when={truncated()}>
          <Flex as="div" justify="center">
            <Text as="span" size={1} color="lowContrast" selectable={false}>
              Showing {filtered().visible.length} of {filtered().total} — refine
              the search to narrow.
            </Text>
          </Flex>
        </Show>
      </Show>
    </Flex>
  );
};
