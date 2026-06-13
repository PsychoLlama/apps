import { Card, Container, Flex, Heading, Text } from '@lib/ui';
import { SiteHeader } from '@lib/shell';
import type {
  GalleryListing as ListingData,
  GalleryManifest,
} from '@dev/gallery';
import { For, Show, type JSX } from 'solid-js';
import { findManifest, manifestLinks } from './listings';
import * as css from './index.css';

export { loadListings } from './listings';

/**
 * The gallery shell: the site header over the active view. Acts as the layout
 * for all `/gallery/*` routes — the manifest cards at `/gallery` and each
 * manifest's own page, which renders every listing it contributes inline.
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
                <Text
                  as="p"
                  size={2}
                  color="lowContrast"
                  trim="end"
                  selectable={false}
                >
                  {manifest.description}
                </Text>
              </Flex>
            </Card>
          </Flex>
        )}
      </For>
    </Flex>
  </Container>
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

/**
 * A manifest's page: its title over every listing it contributes. The manifest
 * resolves synchronously from its slug; `renderListings` supplies the async body
 * — the router owns the `lazy`/`Suspense` load (it has the SolidStart server
 * deps that async/server boundaries need). An unknown slug falls back to a
 * not-found message.
 */
export const ManifestPage = (props: {
  slug: string;
  renderListings: (manifest: GalleryManifest) => JSX.Element;
}) => (
  <Show
    when={findManifest(props.slug)}
    keyed
    fallback={
      <Text as="p" size={2} color="lowContrast" selectable={false}>
        No such manifest.
      </Text>
    }
  >
    {(manifest) => (
      <Flex as="div" direction="column" gap={6}>
        <Heading as="h1" size={7} weight="bold" selectable={false}>
          {manifest.title}
        </Heading>

        {props.renderListings(manifest)}
      </Flex>
    )}
  </Show>
);
