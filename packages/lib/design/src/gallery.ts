import {
  defineGallery,
  type GalleryGroupId,
  type GalleryListing,
} from '@lib/gallery';
import { name, description } from '@lib/design/package.json';

// Token listings build their axes programmatically, so re-export the helper
// types they reach for — listings import everything through `#gallery`.
export type { GalleryAxis, GallerySection } from '@lib/gallery';

/**
 * `@lib/design`'s gallery manifest. Token listings aren't bucketed, so `groups`
 * is empty and {@link Listing} forbids a `group` — the package opts out of
 * grouping while still owning its manifest title/description here rather than in
 * the gallery app.
 */
const gallery = defineGallery({
  name,
  description,
  groups: [],
});

export default gallery;

/** A group id valid for `@lib/design` listings — none are declared. */
export type GroupId = GalleryGroupId<typeof gallery>;

/**
 * A `@lib/design` gallery listing. The package declares no groups, so `group`
 * is unavailable; author each `*.gallery.tsx` against this instead of
 * `@lib/gallery`'s `GalleryListing`.
 */
export type Listing<P = Record<string, never>> = GalleryListing<P, GroupId>;
