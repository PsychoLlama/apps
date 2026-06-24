import { createSignal, For } from 'solid-js';
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@lib/ui';
import type { GalleryListing, GallerySection } from '@lib/gallery';
import { SectionGrid } from './section-grid';
import { slugify } from './slugify';

/** A listing erased to the registry's shared shape (see `@lib/gallery`). */
type Listing = GalleryListing<unknown, string>;
type Section = GallerySection<unknown>;

/** A listing's sections as a tab strip, each panel holding its permutation grid. */
export const SectionTabs = (props: {
  listing: Listing;
  sections: readonly Section[];
}) => {
  const [active, setActive] = createSignal('0');
  const slug = () => slugify(props.listing.title);
  return (
    <TabsRoot
      value={active()}
      onValueChange={setActive}
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
