import { For, Match, Switch } from 'solid-js';
import { Grid, Text } from '@lib/ui';
import type { GalleryListing, GallerySection } from '@lib/gallery';
import * as css from './section-grid.css';

/** A listing erased to the registry's shared shape (see `@lib/gallery`). */
type Listing = GalleryListing<unknown, string>;
type Section = GallerySection<unknown>;

// Caps the `grid-template-columns` lookup — wider sections clamp to this many
// tracks. Sized for the widest axis we render: the color scale's 12 steps plus
// a header column.
const MAX_TRACKS = 13;

// Joins class names, dropping the unset ones.
const cx = (...names: Array<string | undefined>): string =>
  names.filter(Boolean).join(' ');

/** Axis title shown above a column or beside a row. */
const AxisHeader = (props: { title: string; class?: string }) => (
  <Text
    as="span"
    size={1}
    weight="medium"
    color="lowContrast"
    selectable={false}
    class={props.class}
  >
    {props.title}
  </Text>
);

// Total grid tracks for a section — selects the `grid-template-columns` variant.
// Both axes add a header column; columns-only spans its columns; rows-only pairs
// each header with its cell across two tracks.
const trackCount = (section: Section): number => {
  const columns = section.columns ?? [];
  const rows = section.rows ?? [];
  if (columns.length > 0 && rows.length > 0) return columns.length + 1;
  if (columns.length > 0) return columns.length;
  return 2;
};

/**
 * A single permutation view: the section's axes laid out as an aligned grid,
 * scrolling on its own x-axis so a wide grid never widens the page. Cells are
 * emitted in row-major order via `<For>` so the layout survives prerendering.
 * Columns-only lays a header row over a cell row; rows-only pairs each row
 * header with its cell; both axes fill a header row, a header column, and a cell
 * at every intersection (the top-left corner stays empty).
 */
export const SectionGrid = (props: { listing: Listing; section: Section }) => {
  const columns = () => props.section.columns ?? [];
  const rows = () => props.section.rows ?? [];
  // Headers pin to their own axis (see `columnHeader`/`rowHeader`) and, when a
  // section tightens its `gap`, pad back out from the cells. Default sections
  // leave the gutter unset and look unchanged.
  const columnClass = () =>
    cx(
      css.columnHeader,
      props.section.gap === undefined ? undefined : css.columnHeaderGutter,
    );
  const rowClass = () =>
    cx(
      css.rowHeader,
      props.section.gap === undefined ? undefined : css.rowHeaderGutter,
    );
  const tracks = () =>
    Math.min(
      trackCount(props.section),
      MAX_TRACKS,
    ) as keyof typeof css.templateColumns;

  return (
    <Grid
      as="div"
      align={props.section.align?.rows ?? 'start'}
      justify={props.section.align?.columns ?? 'start'}
      gapX={props.section.gap ?? 5}
      gapY={props.section.gap ?? 4}
      class={`${css.grid} ${css.templateColumns[tracks()]}`}
    >
      <Switch>
        <Match when={columns().length > 0 && rows().length > 0}>
          <AxisHeader title="" />
          <For each={columns()}>
            {(column) => (
              <AxisHeader title={column.title} class={columnClass()} />
            )}
          </For>
          <For each={rows()}>
            {(row) => (
              <>
                <AxisHeader title={row.title} class={rowClass()} />
                <For each={columns()}>
                  {(column) =>
                    props.listing.render({ ...row.props, ...column.props })
                  }
                </For>
              </>
            )}
          </For>
        </Match>
        <Match when={columns().length > 0}>
          <For each={columns()}>
            {(column) => (
              <AxisHeader title={column.title} class={columnClass()} />
            )}
          </For>
          <For each={columns()}>
            {(column) => props.listing.render(column.props)}
          </For>
        </Match>
        <Match when={rows().length > 0}>
          <For each={rows()}>
            {(row) => (
              <>
                <AxisHeader title={row.title} class={rowClass()} />
                {props.listing.render(row.props)}
              </>
            )}
          </For>
        </Match>
      </Switch>
    </Grid>
  );
};
