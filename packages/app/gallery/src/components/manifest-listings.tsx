import { For, Show } from 'solid-js';
import { Button, Callout, Flex, Heading } from '@lib/ui';
import type { GalleryGroup, GalleryListing } from '@lib/gallery';
import IconChevron from 'virtual:icons/mdi/chevron-right';
import { ListingView } from './listing-view';
import * as css from './manifest-listings.css';

/** A listing erased to the registry's shared shape (see `@lib/gallery`). */
type Listing = GalleryListing<unknown, string>;

/** A group paired with the listings that declared its id. */
interface ListingBucket {
  group: GalleryGroup;
  listings: Listing[];
}

/**
 * Partition pre-sorted listings into their package's declared groups, keeping
 * the manifest's group order and dropping empty buckets. Listings arrive sorted
 * by title, so each bucket inherits that order.
 */
const groupListings = (
  listings: Listing[],
  groups: ReadonlyArray<GalleryGroup>,
): ListingBucket[] =>
  groups
    .map((group) => ({
      group,
      listings: listings.filter((listing) => listing.group === group.id),
    }))
    .filter((bucket) => bucket.listings.length > 0);

/** A column of `ListingView`s, sorted by title. */
const ListingColumn = (props: { listings: Listing[] }) => (
  <Flex as="div" direction="column" gap={8}>
    <For each={props.listings}>
      {(listing) => <ListingView listing={listing} />}
    </For>
  </Flex>
);

/**
 * A collapsible group: its `label` heads a `<summary>` toggle that closes over
 * the group's listing column. Expanded by default — every group opens on load.
 */
const ListingGroup = (props: { group: GalleryGroup; listings: Listing[] }) => (
  <Flex as="details" direction="column" gap={5} open class={css.group}>
    <Button
      as="summary"
      variant="ghost"
      color="neutral"
      class={css.summary}
      testId={`gallery-group-${props.group.id}`}
    >
      <Heading
        as="h2"
        size={6}
        weight="bold"
        color="highContrast"
        selectable={false}
      >
        {props.group.label}
      </Heading>
      <IconChevron
        width="20"
        height="20"
        aria-hidden="true"
        class={css.chevron}
      />
    </Button>
    <ListingColumn listings={props.listings} />
  </Flex>
);

/**
 * A manifest's listings, sorted by title. A package with no declared groups
 * renders one flat column; a package with groups buckets its listings into a
 * collapsible disclosure per group, ordered by the manifest's group
 * declaration.
 */
export const ManifestListings = (props: {
  listings: Listing[];
  groups: ReadonlyArray<GalleryGroup>;
}) => (
  <Show
    when={props.listings.length > 0}
    fallback={
      <Flex as="div" align="start">
        <Callout color="neutral" size={1}>
          This gallery is empty.
        </Callout>
      </Flex>
    }
  >
    <Show
      when={props.groups.length > 0}
      fallback={<ListingColumn listings={props.listings} />}
    >
      <Flex as="div" direction="column">
        <For each={groupListings(props.listings, props.groups)}>
          {(bucket) => (
            <ListingGroup group={bucket.group} listings={bucket.listings} />
          )}
        </For>
      </Flex>
    </Show>
  </Show>
);
