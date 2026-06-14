import { Show } from 'solid-js';
import { Flex, Heading, Link } from '@lib/ui';
import type { GalleryListing } from '@lib/gallery';
import { SectionGrid } from './section-grid';
import { SectionTabs } from './section-tabs';
import { slugify } from './slugify';

/** A listing erased to the registry's shared shape (see `@lib/gallery`). */
type Listing = GalleryListing<unknown>;

/** A no-variant listing's body — `render` invoked once with no overrides. */
const NoVariant = (props: { listing: Listing }) => (
  <>{props.listing.render({})}</>
);

/**
 * A resolved listing: its title over its permutation grids. Multiple sections
 * become a tab strip; a single section renders its grid directly (no tab nav
 * for one option); a listing with no sections renders `render` once.
 */
export const ListingView = (props: { listing: Listing }) => {
  const sections = () => props.listing.sections ?? [];
  return (
    <Flex as="section" direction="column" gap={3}>
      <Heading
        as="h2"
        id={props.listing.title}
        size={5}
        weight="medium"
        selectable={false}
      >
        <Link
          href={`#${encodeURIComponent(props.listing.title)}`}
          color="neutral"
          highContrast
          underline="hover"
          testId={`gallery-anchor-${slugify(props.listing.title)}`}
        >
          {props.listing.title}
        </Link>
      </Heading>
      <Show
        when={sections().length > 1}
        fallback={
          <Show
            when={sections()[0]}
            fallback={<NoVariant listing={props.listing} />}
          >
            {(section) => (
              <SectionGrid listing={props.listing} section={section()} />
            )}
          </Show>
        }
      >
        <SectionTabs listing={props.listing} sections={sections()} />
      </Show>
    </Flex>
  );
};
