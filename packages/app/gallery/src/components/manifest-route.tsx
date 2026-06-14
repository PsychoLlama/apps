import { Flex, Heading, Text } from '@lib/ui';
import { collectListings, type GalleryListing } from '@dev/gallery';
import { ManifestListings } from './manifest-listings';
import { GalleryView } from './gallery-view';

/**
 * A manifest's page, rendered by its dedicated `/gallery/<slug>` route. The
 * route hands over its package's name, description, and an eager
 * `import.meta.glob` of that package's `*.gallery.tsx` files; this collects them
 * into listings (sorted by title) under a `Gallery › <manifest>` breadcrumb.
 *
 * The glob is eager on purpose: the listings compile into the route's own chunk,
 * so SolidStart preloads them alongside the route and the page paints complete —
 * no flash while a deferred listings import streams in after navigation.
 */
export const ManifestRoute = (props: {
  /** Manifest title, conventionally the package name (`@lib/ui`). */
  title: string;
  /** One-line summary, conventionally the package's `description`. */
  description: string;
  /** Eager `import.meta.glob` of the package's `*.gallery.tsx` modules. */
  listings: Record<string, { default: GalleryListing<unknown> }>;
}) => {
  const listings = () =>
    collectListings(props.listings).sort((left, right) =>
      left.title.localeCompare(right.title),
    );

  return (
    <GalleryView
      trail={[{ label: 'Gallery', href: '/gallery' }, { label: props.title }]}
    >
      <Flex as="div" direction="column" gap={6}>
        <Flex as="div" direction="column" gap={2}>
          <Heading as="h1" size={7} weight="bold" selectable={false}>
            {props.title}
          </Heading>
          <Text as="p" size={3} color="lowContrast" selectable={false}>
            {props.description}
          </Text>
        </Flex>

        <ManifestListings listings={listings()} />
      </Flex>
    </GalleryView>
  );
};
