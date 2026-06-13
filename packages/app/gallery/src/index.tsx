import { Callout, Card, Container, Flex, Heading, Link, Text } from '@lib/ui';
import { SiteHeader } from '@lib/shell';
import type { GalleryListing as ListingData } from '@dev/gallery';
import { For, Show, type JSX } from 'solid-js';
import IconAlert from 'virtual:icons/mdi/alert-outline';
import { findManifest, listingsOf, manifestLinks } from './listings';
import type { ListingLink } from './listings';
import * as css from './index.css';

export { findListing } from './listings';
export type { ListingLink, ListingModule } from './listings';

/**
 * The gallery shell: the site header over the active view. Acts as the layout
 * for all `/gallery/*` routes, which drill down from the manifest cards at
 * `/gallery` into a manifest's listings and finally a single listing.
 */
export const Gallery = (props: { children?: JSX.Element }) => (
  <Flex as="main" direction="column" grow>
    <SiteHeader title="Gallery" />

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
  </Flex>
);

/** The gallery landing page: one card per manifest, linking to its own page. */
export const GalleryHome = () => (
  <Container as="div" size={2}>
    <Flex as="ul" direction="column" gap={3} aria-label="Manifests">
      <For each={manifestLinks}>
        {(manifest) => (
          <Flex as="li">
            <Card
              as="a"
              href={manifest.href}
              testId={`manifest-${manifest.slug}`}
              size={3}
              class={css.card}
            >
              <Flex as="div" direction="column" gap={1}>
                <Heading as="h2" size={3} weight="medium" selectable={false}>
                  {manifest.title}
                </Heading>
                <Text as="p" size={2} selectable={false}>
                  {manifest.description}
                </Text>
                <Text
                  as="p"
                  size={2}
                  color="lowContrast"
                  trim="end"
                  selectable={false}
                >
                  {manifest.count}{' '}
                  {manifest.count === 1 ? 'listing' : 'listings'}
                </Text>
              </Flex>
            </Card>
          </Flex>
        )}
      </For>
    </Flex>
  </Container>
);

/** A manifest's listings as a column of nav links. */
const ListingLinks = (props: { listings: ListingLink[] }) => (
  <Show
    when={props.listings.length > 0}
    fallback={
      <Text as="p" size={2} color="lowContrast" selectable={false}>
        No listings
      </Text>
    }
  >
    <Flex as="ul" direction="column" gap={1}>
      <For each={props.listings}>
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
);

/**
 * A manifest's page: a work-in-progress notice over links to every listing the
 * manifest contributes. Driven by a manifest slug route param.
 */
export const ManifestPage = (props: { slug: string }) => (
  <Show
    when={findManifest(props.slug)}
    fallback={
      <Text as="p" size={2} color="lowContrast" selectable={false}>
        No such manifest.
      </Text>
    }
  >
    {(manifest) => (
      <Flex as="div" direction="column" gap={6}>
        <Heading as="h1" size={5} weight="bold" selectable={false}>
          {manifest().title}
        </Heading>

        <Callout color="warning" icon={<IconAlert />}>
          <Text as="p" size={2} selectable={false}>
            Work in progress.
          </Text>
        </Callout>

        <ListingLinks listings={listingsOf(manifest())} />
      </Flex>
    )}
  </Show>
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
