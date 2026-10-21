import { defineCommand, defineStore } from '@lib/state/next';

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

/**
 * Which permutation tab each listing is showing, live while any tab strip
 * holds it. Leaving a manifest page releases it, so a fresh visit opens
 * every listing on its first section.
 */
export const $gallery = defineStore<GalleryState>(() => ({
  activeSections: {},
}));

/**
 * A listing's tab strip moved to a different section. Keyed by title
 * because that's a listing's identity — titles are unique within the
 * manifest a page renders.
 */
export const $sectionSelected = defineCommand(
  [$gallery],
  (gallery) => (listing: string, section: string) => {
    gallery.activeSections[listing] = section;
  },
);
