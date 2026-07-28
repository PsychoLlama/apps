import { defineFold, defineScope, defineStore, defineTopic } from '@lib/state';

/**
 * Owns the gallery's view state: which permutation tab each listing is
 * showing. Anchored by the tab strips themselves rather than by a route, so
 * the selections live exactly as long as a manifest page has tabs on screen.
 *
 * Nothing durable dies with it. A fresh visit opens every listing on its
 * first section, which is where a listing sits before it's touched anyway.
 */
export const galleryScope = defineScope();

/** The gallery's per-listing view state. */
export interface GalleryState {
  /**
   * The open section per listing, keyed by listing title. Values are
   * `TabsRoot` values — a section's index rendered as a string. A listing
   * with no entry hasn't been touched and sits on {@link FIRST_SECTION}.
   */
  activeSections: { [listingTitle: string]: string | undefined };
}

/**
 * The section a listing opens to. Sections are addressed by index, so the
 * first one is `'0'` — see `SectionTabs`, which mints the same values for
 * its triggers and panels.
 */
export const FIRST_SECTION = '0';

/** Live, readonly view of the gallery's tab selections. */
export const galleryStore = defineStore<GalleryState>(galleryScope, () => ({
  activeSections: {},
}));

/**
 * A listing's tab strip moved to a different section. Keyed by title
 * because that's a listing's identity — titles are unique within the
 * manifest a page renders, and the scope doesn't outlive that page.
 */
export const sectionSelectedTopic = defineTopic<{
  /** Title of the listing whose tab strip moved. */
  listing: string;
  /** The newly active section, as a `TabsRoot` value. */
  section: string;
}>();
defineFold(sectionSelectedTopic, [galleryStore], (gallery, selection) => {
  gallery.activeSections[selection.listing] = selection.section;
});
