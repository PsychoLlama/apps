import { Flex, Heading, Link, Text } from '@lib/ui';
import { SiteHeader } from '@lib/shell';
import type { GalleryListing as ListingData } from '@dev/gallery';
import { galleryManifests } from '@dev/gallery/manifests';
import { For, Show, type JSX } from 'solid-js';
import { listingsOf } from './listings';
import * as css from './index.css';

export { findListing } from './listings';
export type { ListingLink, ListingModule } from './listings';

/**
 * The gallery shell: a persistent sidebar nav over every package's listings,
 * with the active listing's page rendered alongside it. Acts as the layout for
 * all `/gallery/*` routes.
 */
export const Gallery = (props: { children?: JSX.Element }) => {
  return (
    <Flex as="main" direction="column" grow>
      <SiteHeader title="Gallery" />

      <Flex as="div" direction="row" class={css.body}>
        <Flex
          as="article"
          direction="column"
          gap={6}
          px={5}
          py={5}
          class={css.content}
        >
          {props.children}
        </Flex>

        <Flex
          as="nav"
          direction="column"
          gap={5}
          px={4}
          py={5}
          aria-label="Gallery"
          class={css.sidebar}
        >
          <For each={galleryManifests}>
            {(manifest) => {
              const listings = listingsOf(manifest);
              return (
                <Flex as="section" direction="column" gap={2}>
                  <Heading
                    as="h2"
                    size={1}
                    weight="medium"
                    color="lowContrast"
                    selectable={false}
                  >
                    {manifest.title}
                  </Heading>

                  <Show
                    when={listings.length > 0}
                    fallback={
                      <Text
                        as="p"
                        size={2}
                        color="lowContrast"
                        selectable={false}
                      >
                        No listings
                      </Text>
                    }
                  >
                    <Flex as="ul" direction="column" gap={1}>
                      <For each={listings}>
                        {(listing) => (
                          <Flex as="li">
                            <Link
                              testId={`listing-${listing.name}`}
                              href={listing.href}
                              size={2}
                              color="neutral"
                            >
                              {listing.name}
                            </Link>
                          </Flex>
                        )}
                      </For>
                    </Flex>
                  </Show>
                </Flex>
              );
            }}
          </For>
        </Flex>
      </Flex>
    </Flex>
  );
};

/** Placeholder shown at `/gallery` before a listing is selected. */
export const GalleryHome = () => (
  <Text as="p" size={2} color="lowContrast" selectable={false}>
    Select a listing to preview it.
  </Text>
);

/**
 * A listing's page heading. Derived from the route param, so it renders
 * immediately — outside the `<Suspense>` boundary that loads the listing body.
 */
export const ListingHeading = (props: { name: string }) => (
  <Heading as="h1" size={5} weight="bold" selectable={false}>
    {props.name}
  </Heading>
);

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

/**
 * A resolved listing's body — its enumerated sections. Pair with
 * {@link ListingHeading} and a router-owned `lazy`/`Suspense` that loads the
 * listing module.
 */
export const ListingView = (props: { listing: ListingData }) => (
  <Flex as="div" direction="column" gap={6}>
    <For each={props.listing.sections}>
      {(section) => (
        <ListingSection title={section.title} items={section.items} />
      )}
    </For>
  </Flex>
);
