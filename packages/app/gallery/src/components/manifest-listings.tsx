import { For, Show, createMemo, createSignal, type JSX } from 'solid-js';
import {
  Flex,
  Grid,
  Heading,
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
  Text,
} from '@lib/ui';
import type { GalleryListing, GallerySection } from '@dev/gallery';
import * as css from './manifest-listings.css';

/** A listing erased to the registry's shared shape (see `@dev/gallery`). */
type Listing = GalleryListing<unknown>;
type Section = GallerySection<unknown>;

// Caps the `grid-template-columns` lookup — wider sections clamp to this many
// tracks. No current axis comes close.
const MAX_TRACKS = 8;

/** Axis title shown above a column or beside a row. */
const AxisHeader = (props: { title: string }) => (
  <Text
    as="span"
    size={1}
    weight="medium"
    color="lowContrast"
    selectable={false}
  >
    {props.title}
  </Text>
);

interface Layout {
  /** Grid children in row-major order: headers interleaved with rendered cells. */
  nodes: JSX.Element[];
  /** Total grid tracks — selects the `grid-template-columns` variant. */
  tracks: number;
}

/**
 * Permute a section's axes through the listing's `render`, emitting grid children
 * in row-major order. Columns-only lays a header row over a cell row; rows-only
 * pairs each row header with its cell; both axes fill a header row, a header
 * column, and a cell at every intersection (the top-left corner stays empty).
 */
const buildLayout = (listing: Listing, section: Section): Layout => {
  const columns = section.columns ?? [];
  const rows = section.rows ?? [];

  if (columns.length > 0 && rows.length > 0) {
    const nodes: JSX.Element[] = [<AxisHeader title="" />];
    for (const column of columns)
      nodes.push(<AxisHeader title={column.title} />);
    for (const row of rows) {
      nodes.push(<AxisHeader title={row.title} />);
      for (const column of columns) {
        nodes.push(listing.render({ ...row.props, ...column.props }));
      }
    }
    return { nodes, tracks: columns.length + 1 };
  }

  if (columns.length > 0) {
    return {
      nodes: [
        ...columns.map((column) => <AxisHeader title={column.title} />),
        ...columns.map((column) => listing.render(column.props)),
      ],
      tracks: columns.length,
    };
  }

  const nodes: JSX.Element[] = [];
  for (const row of rows) {
    nodes.push(<AxisHeader title={row.title} />);
    nodes.push(listing.render(row.props));
  }
  return { nodes, tracks: 2 };
};

/** A single permutation view: the section's axes laid out as an aligned grid. */
const SectionGrid = (props: { listing: Listing; section: Section }) => {
  const layout = createMemo(() => buildLayout(props.listing, props.section));
  return (
    <Grid
      as="div"
      align="start"
      justify="start"
      gapX={5}
      gapY={4}
      class={`${css.grid} ${
        css.templateColumns[
          Math.min(
            layout().tracks,
            MAX_TRACKS,
          ) as keyof typeof css.templateColumns
        ]
      }`}
    >
      <For each={layout().nodes}>{(node) => node}</For>
    </Grid>
  );
};

const slugify = (title: string): string =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** A listing's sections as a tab strip, each panel holding its permutation grid. */
const SectionTabs = (props: {
  listing: Listing;
  sections: readonly Section[];
}) => {
  const [active, setActive] = createSignal('0');
  const slug = () => slugify(props.listing.title);
  return (
    <TabsRoot
      value={active()}
      onValueChange={setActive}
      testId={`gallery-tabs-${slug()}`}
    >
      <TabsList testId={`gallery-tabs-list-${slug()}`}>
        <For each={props.sections}>
          {(section, index) => (
            <TabsTrigger
              value={String(index())}
              testId={`gallery-tab-${slug()}-${index()}`}
            >
              {section.title}
            </TabsTrigger>
          )}
        </For>
      </TabsList>
      <For each={props.sections}>
        {(section, index) => (
          <TabsContent
            value={String(index())}
            testId={`gallery-panel-${slug()}-${index()}`}
          >
            <SectionGrid listing={props.listing} section={section} />
          </TabsContent>
        )}
      </For>
    </TabsRoot>
  );
};

/** A no-variant listing's body — `render` invoked once with no overrides. */
const NoVariant = (props: { listing: Listing }) => (
  <>{props.listing.render({})}</>
);

/**
 * A resolved listing: its title over its permutation grids. Multiple sections
 * become a tab strip; a single section renders its grid directly (no tab nav
 * for one option); a listing with no sections renders `render` once.
 */
const ListingView = (props: { listing: Listing }) => {
  const sections = () => props.listing.sections ?? [];
  return (
    <Flex as="section" direction="column" gap={3}>
      <Heading as="h2" size={5} weight="medium" selectable={false}>
        {props.listing.title}
      </Heading>
      <Show
        when={sections().length > 1}
        fallback={
          <Show
            when={sections()[0]}
            fallback={<NoVariant listing={props.listing} />}
          >
            {(section) => (
              <SectionGrid listing={props.listing} section={section()} />
            )}
          </Show>
        }
      >
        <SectionTabs listing={props.listing} sections={sections()} />
      </Show>
    </Flex>
  );
};

/**
 * A manifest's listings, rendered inline and sorted by title. Each listing's
 * declared title heads a tab strip whose panels permute the listing's axes
 * through its single-cell `render`.
 */
export const ManifestListings = (props: { listings: Listing[] }) => (
  <Show
    when={props.listings.length > 0}
    fallback={
      <Text as="p" size={2} color="lowContrast" selectable={false}>
        No listings
      </Text>
    }
  >
    <Flex as="div" direction="column" gap={8}>
      <For each={props.listings}>
        {(listing) => <ListingView listing={listing} />}
      </For>
    </Flex>
  </Show>
);
