import { For, Show } from 'solid-js';
import { Callout, Flex } from '@lib/ui';
import type { GalleryListing } from '@lib/gallery';
import { ListingView } from './listing-view';

/** A listing erased to the registry's shared shape (see `@lib/gallery`). */
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
      <Flex as="div" align="start">
        <Callout color="neutral" size={1}>
          This gallery is empty.
        </Callout>
      </Flex>
    }
  >
    <Flex as="div" direction="column" gap={8}>
      <For each={props.listings}>
        {(listing) => <ListingView listing={listing} />}
      </For>
    </Flex>
  </Show>
);
