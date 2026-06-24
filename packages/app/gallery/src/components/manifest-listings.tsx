import { For, Show } from 'solid-js';
import { Callout, Flex, Heading } from '@lib/ui';
import type { GalleryGroup, GalleryListing } from '@lib/gallery';
import { ListingView } from './listing-view';

/** A listing erased to the registry's shared shape (see `@lib/gallery`). */
type Listing = GalleryListing<unknown, string>;

/** A group paired with the listings that declared its id. */
interface ListingGroup {
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
): ListingGroup[] =>
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
 * A manifest's listings, sorted by title. A package with no declared groups
 * renders one flat column; a package with groups buckets its listings under a
 * `group.label` heading, ordered by the manifest's group declaration.
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
      <Flex as="div" direction="column" gap={9}>
        <For each={groupListings(props.listings, props.groups)}>
          {(bucket) => (
            <Flex as="section" direction="column" gap={5}>
              <Heading as="h2" size={6} weight="bold" selectable={false}>
                {bucket.group.label}
              </Heading>
              <ListingColumn listings={bucket.listings} />
            </Flex>
          )}
        </For>
      </Flex>
    </Show>
  </Show>
);
