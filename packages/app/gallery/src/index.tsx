import { Flex, Heading, Link, Text } from '@lib/ui';
import { SiteHeader } from '@lib/shell';
import type { GalleryManifest } from '@dev/gallery';
import { galleryManifests } from '@dev/gallery/manifests';
import { For, Show } from 'solid-js';
import * as css from './index.css';

/** A single listing's entry in the sidebar nav. */
interface ListingLink {
  /** Basename of the `*.gallery.tsx` file, used as both label and slug. */
  name: string;
  /** In-app path to the listing's page. */
  href: string;
}

/**
 * The manifest's listings as sorted nav entries. Each key is a module path
 * like `./components/badge/badge.gallery.tsx`; the basename minus the
 * `.gallery.tsx` suffix is the listing's name.
 */
const listingsOf = (manifest: GalleryManifest): ListingLink[] =>
  Object.keys(manifest.listings)
    .map((path) => {
      const name = path
        .split('/')
        .pop()!
        .replace(/\.gallery\.tsx$/, '');
      return { name, href: `/gallery/${name}` };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

export const Gallery = () => {
  return (
    <Flex as="main" direction="column" grow>
      <SiteHeader title="Gallery" />

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
                    <Text as="p" size={2} color="lowContrast">
                      No listings yet
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
  );
};
