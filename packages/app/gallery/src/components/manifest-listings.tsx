import { For, Show } from 'solid-js';
import { Flex, Heading, Text } from '@lib/ui';
import type { GalleryListing as ListingData } from '@dev/gallery';

/** A labeled row of a listing's pre-rendered component instances. */
const ListingSection = (props: {
  title: string;
  items: ListingData['sections'][number]['items'];
}) => (
  <Flex as="section" direction="column" gap={3}>
    <Heading
      as="h3"
      size={2}
      weight="medium"
      color="lowContrast"
      selectable={false}
    >
      {props.title}
    </Heading>
    <Flex as="div" direction="row" wrap="wrap" align="center" gap={3}>
      <For each={props.items}>{(item) => item}</For>
    </Flex>
  </Flex>
);

/** A resolved listing's body — its enumerated sections. */
const ListingView = (props: { listing: ListingData }) => (
  <Flex as="div" direction="column" gap={6}>
    <For each={props.listing.sections}>
      {(section) => (
        <ListingSection title={section.title} items={section.items} />
      )}
    </For>
  </Flex>
);

/**
 * A manifest's listings, rendered inline and sorted by title. Each listing's
 * declared title heads its enumerated sections.
 */
export const ManifestListings = (props: { listings: ListingData[] }) => (
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
        {(listing) => (
          <Flex as="section" direction="column" gap={3}>
            <Heading as="h2" size={5} weight="medium" selectable={false}>
              {listing.title}
            </Heading>
            <ListingView listing={listing} />
          </Flex>
        )}
      </For>
    </Flex>
  </Show>
);
