import { For, Show } from 'solid-js';
import { Flex, Text } from '@lib/ui';
import type { GalleryListing } from '@dev/gallery';
import { ListingView } from './listing-view';

/** A listing erased to the registry's shared shape (see `@dev/gallery`). */
type Listing = GalleryListing<unknown>;

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
