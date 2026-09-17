import { For, Show } from 'solid-js';
import { Callout, Flex, Heading, Link } from '@lib/ui';
import type { GalleryGroup, GalleryListing } from '@lib/gallery';
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
const ListingColumn = (props: { listings: Listing[]; level?: 'h2' | 'h3' }) => (
  <Flex as="div" direction="column" gap={8}>
    <For each={props.listings}>
      {(listing) => <ListingView listing={listing} level={props.level} />}
    </For>
  </Flex>
);

/**
 * A group: its `label` as an anchor-linked heading over the group's listing
 * column. The anchor is the group's `id` suffixed with `-group`, keeping it
 * distinct from listing anchors (those use the raw listing title).
 */
const ListingGroup = (props: { group: GalleryGroup; listings: Listing[] }) => (
  <Flex as="section" direction="column" gap={5} class={css.group}>
    <Heading
      as="h2"
      id={`${props.group.id}-group`}
      size={6}
      weight="bold"
      selectable={false}
    >
      <Link
        href={`#${props.group.id}-group`}
        color="neutral"
        highContrast
        underline="hover"
        testId={`gallery-group-${props.group.id}`}
      >
        {props.group.label}
      </Link>
    </Heading>
    <ListingColumn listings={props.listings} level="h3" />
  </Flex>
);

/**
 * A manifest's listings, sorted by title. A package with no declared groups
 * renders one flat column; a package with groups buckets its listings under a
 * heading per group, ordered by the manifest's group declaration.
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
