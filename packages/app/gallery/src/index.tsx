import { Card, Container, Flex, Heading, Text } from '@lib/ui';
import { SiteHeader, type SiteHeaderCrumb } from '@lib/shell';
import type {
  GalleryListing as ListingData,
  GalleryManifest,
} from '@dev/gallery';
import { For, Show, type JSX } from 'solid-js';
import { findManifest, manifestLinks } from './listings';
import * as css from './index.css';

export { loadListings } from './listings';

/**
 * The gallery layout: the `<main>` frame shared by every `/gallery/*` route.
 * Each route renders its own `GalleryView` inside, so the breadcrumb can name
 * the manifest in view without the layout reverse-engineering the active route.
 */
export const Gallery = (props: { children?: JSX.Element }) => (
  <Flex as="main" direction="column" grow>
    {props.children}
  </Flex>
);

/**
 * A gallery view: a breadcrumb header over the scrollable content region. Each
 * route renders one — `trail` names where you are (`Gallery` on the landing
 * page, `Gallery › <manifest>` on a manifest page), and the content fills and
 * scrolls below it within the `Gallery` layout's `<main>` frame.
 */
const GalleryView = (props: {
  trail: SiteHeaderCrumb[];
  children?: JSX.Element;
}) => (
  <>
    <SiteHeader trail={props.trail} />
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
  </>
);

/** The gallery landing page: one card per manifest, linking to its own page. */
export const GalleryHome = () => (
  <GalleryView trail={[{ label: 'Gallery' }]}>
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
  </GalleryView>
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
 * A manifest's page: its breadcrumb (`Gallery › <manifest>`, with `Gallery`
 * linking back to the landing page) over every listing it contributes. The
 * manifest resolves synchronously from its slug — an unknown slug keeps the raw
 * segment in the crumb and falls back to a not-found body. `renderListings`
 * supplies the async body; the router owns the `lazy`/`Suspense` load (it has
 * the SolidStart server deps that async/server boundaries need).
 */
export const ManifestPage = (props: {
  slug: string;
  renderListings: (manifest: GalleryManifest) => JSX.Element;
}) => {
  const manifest = () => findManifest(props.slug);

  return (
    <GalleryView
      trail={[
        { label: 'Gallery', href: '/gallery' },
        { label: manifest()?.title ?? props.slug },
      ]}
    >
      <Show
        when={manifest()}
        keyed
        fallback={
          <Text as="p" size={2} color="lowContrast" selectable={false}>
            No such manifest.
          </Text>
        }
      >
        {(found) => (
          <Flex as="div" direction="column" gap={6}>
            <Heading as="h1" size={7} weight="bold" selectable={false}>
              {found.title}
            </Heading>

            {props.renderListings(found)}
          </Flex>
        )}
      </Show>
    </GalleryView>
  );
};
