import { For } from 'solid-js';
import { useAction, useValue } from '@lib/effects/solid';
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@lib/ui';
import type { GalleryListing, GallerySection } from '@lib/gallery';
import { $gallery, $sectionSelected, FIRST_SECTION } from '../state';
import { SectionGrid } from './section-grid';
import { slugify } from './slugify';

/** A listing erased to the registry's shared shape (see `@lib/gallery`). */
type Listing = GalleryListing<unknown, string>;
type Section = GallerySection<unknown>;

/**
 * A listing's sections as a tab strip, each panel holding its permutation
 * grid. Selection lives in `$gallery`, keyed by listing title — every strip
 * on the page shares it, and it releases when the last one unmounts, so
 * leaving the manifest resets the page to its first tabs.
 */
export const SectionTabs = (props: {
  listing: Listing;
  sections: readonly Section[];
}) => {
  const gallery = useValue($gallery);
  const selectSection = useAction($sectionSelected);
  const slug = () => slugify(props.listing.title);
  const active = () =>
    gallery().activeSections[props.listing.title] ?? FIRST_SECTION;

  return (
    <TabsRoot
      value={active()}
      onValueChange={(section) => selectSection(props.listing.title, section)}
      testId={`gallery-tabs-${slug()}`}
    >
      <TabsList testId={`gallery-tabs-list-${slug()}`}>
        <For each={props.sections}>
          {(section, index) => (
            <TabsTrigger
              value={String(index())}
              testId={`gallery-tab-${slug()}-${index()}`}
            >
              {section.title}
            </TabsTrigger>
          )}
        </For>
      </TabsList>
      <For each={props.sections}>
        {(section, index) => (
          <TabsContent
            value={String(index())}
            testId={`gallery-panel-${slug()}-${index()}`}
          >
            <SectionGrid listing={props.listing} section={section} />
          </TabsContent>
        )}
      </For>
    </TabsRoot>
  );
};
