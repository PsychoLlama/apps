import {
  defineGallery,
  type GalleryGroupId,
  type GalleryListing,
} from '@lib/gallery';
import { name, description } from '@lib/ui/package.json';

/**
 * `@lib/ui`'s gallery manifest — the title/description the gallery app surfaces
 * and the groups its `*.gallery.tsx` listings sort into. Listings import the
 * {@link Listing} alias from here (`#gallery`) so a group id rename ripples
 * across the package at compile time; the gallery app reads the default export
 * (`@lib/ui/gallery`) for the manifest card and group labels.
 */
const gallery = defineGallery({
  name,
  description,
  groups: [
    { id: 'form', label: 'Form' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'display', label: 'Display' },
    { id: 'typography', label: 'Typography' },
  ],
});

export default gallery;

/** A group id valid for `@lib/ui` listings. */
export type GroupId = GalleryGroupId<typeof gallery>;

/**
 * A `@lib/ui` gallery listing, bound to the package's group ids. Author each
 * `*.gallery.tsx` against this instead of `@lib/gallery`'s `GalleryListing` so
 * `group` only accepts a declared id.
 */
export type Listing<P = Record<string, never>> = GalleryListing<P, GroupId>;
