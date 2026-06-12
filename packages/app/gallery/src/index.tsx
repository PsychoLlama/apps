import { Flex, Heading, Link, Text } from '@lib/ui';
import { SiteHeader } from '@lib/shell';
import type {
  GalleryListing as ListingData,
  GalleryManifest,
} from '@dev/gallery';
import { galleryManifests } from '@dev/gallery/manifests';
import { For, Show, type JSX } from 'solid-js';
import * as css from './index.css';

/** A single listing's entry in the sidebar nav. */
interface ListingLink {
  /** Basename of the `*.gallery.tsx` file, used as both label and slug. */
  name: string;
  /** In-app path to the listing's page. */
  href: string;
}

/**
 * The listing's name — the basename of its module path minus the
 * `.gallery.tsx` suffix (e.g. `./components/badge/badge.gallery.tsx` → `badge`).
 */
const listingName = (path: string): string =>
  path
    .split('/')
    .pop()!
    .replace(/\.gallery\.tsx$/, '');

/**
 * A URL-safe slug for a manifest title. Titles carry a slash (`@lib/ui`), and a
 * slash can't survive a single path segment: the static prerender decodes a
 * `%2F` back into a separator, so the route stops matching and the page renders
 * empty. Dropping the leading `@` and swapping `/` for `-` keeps each title a
 * stable, readable, slash-free segment (`@lib/ui` → `lib-ui`).
 */
const manifestSlug = (title: string): string =>
  title.replace(/^@/, '').replaceAll('/', '-');

/**
 * The manifest's listings as sorted nav entries, each linking to its own page
 * under `/gallery/{title-slug}/{name}`.
 */
const listingsOf = (manifest: GalleryManifest): ListingLink[] =>
  Object.keys(manifest.listings)
    .map((path) => {
      const name = listingName(path);
      const href = `/gallery/${manifestSlug(manifest.title)}/${encodeURIComponent(name)}`;
      return { name, href };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

/**
 * The deferred loader for the listing under `titleSlug` (a manifest title's
 * {@link manifestSlug}) named `listing`, or `undefined` when neither matches.
 * Routing owns the actual `lazy`/`Suspense` load.
 */
export const findListing = (
  titleSlug: string,
  listing: string,
): (() => Promise<{ default: ListingData }>) | undefined => {
  const manifest = galleryManifests.find(
    (entry) => manifestSlug(entry.title) === titleSlug,
  );
  const match = Object.entries(manifest?.listings ?? {}).find(
    ([path]) => listingName(path) === listing,
  );
  return match?.[1] as (() => Promise<{ default: ListingData }>) | undefined;
};

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
 * A resolved listing's full page — its name over its enumerated sections.
 * Pair with a router-owned `lazy`/`Suspense` to load the listing module.
 */
export const ListingView = (props: { name: string; listing: ListingData }) => (
  <Flex as="div" direction="column" gap={6}>
    <Heading as="h1" size={5} weight="bold" selectable={false}>
      {props.name}
    </Heading>
    <For each={props.listing.sections}>
      {(section) => (
        <ListingSection title={section.title} items={section.items} />
      )}
    </For>
  </Flex>
);
