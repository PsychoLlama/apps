import { Flex, Heading, Text } from '@lib/ui';
import type { GalleryGroup, GalleryListing } from '@lib/gallery';
import { ManifestListings } from './manifest-listings';
import { GalleryView } from './gallery-view';

/**
 * Collect an eager `import.meta.glob` of a package's `*.gallery.tsx` modules
 * into a listing array — each module's default export is its listing. A
 * package's dedicated `/gallery/<slug>` route hands its glob here so every
 * listing renders together on one page.
 */
const collectListings = (
  modules: Record<string, { default: GalleryListing<unknown, string> }>,
): GalleryListing<unknown, string>[] =>
  Object.values(modules).map((module) => module.default);

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
  /**
   * The groups this manifest's listings sort into, in declaration order. Empty
   * for a package that opts out of grouping — listings then render as one flat
   * column.
   */
  groups: ReadonlyArray<GalleryGroup>;
  /** Eager `import.meta.glob` of the package's `*.gallery.tsx` modules. */
  listings: Record<string, { default: GalleryListing<unknown, string> }>;
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

        <ManifestListings listings={listings()} groups={props.groups} />
      </Flex>
    </GalleryView>
  );
};
