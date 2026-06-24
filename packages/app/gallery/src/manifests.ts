import uiGallery from '@lib/ui/gallery';
import designGallery from '@lib/design/gallery';

/** A manifest's card on the gallery landing page. */
export interface ManifestLink {
  /** The manifest's display title — conventionally the package name. */
  title: string;
  /** One-line summary of the manifest's package. */
  description: string;
  /** URL-safe slug for the manifest, used as its route segment. */
  slug: string;
  /** In-app path to the manifest's page. */
  href: string;
}

/**
 * A URL-safe slug for a manifest title. Titles carry a slash (`@lib/ui`); a
 * slash can't survive a single path segment, so drop the leading `@` and swap
 * `/` for `-` to keep each title a stable, readable segment (`@lib/ui` →
 * `lib-ui`). Must match the slug of the manifest's dedicated route file under
 * `@app/main/src/routes/gallery/`.
 */
const manifestSlug = (title: string): string =>
  title.replace(/^@/, '').replaceAll('/', '-');

const manifest = (title: string, description: string): ManifestLink => {
  const slug = manifestSlug(title);
  return { title, description, slug, href: `/gallery/${slug}` };
};

/**
 * Every manifest as a landing-page card link, sorted by title. Each entry
 * pairs with a dedicated `/gallery/<slug>` route that owns its listings — add a
 * package here and add its route file together. Titles and descriptions track
 * each package's `defineGallery` manifest so the two stay in step.
 */
export const manifestLinks: ManifestLink[] = [
  manifest(uiGallery.name, uiGallery.description),
  manifest(designGallery.name, designGallery.description),
].sort((left, right) => left.title.localeCompare(right.title));
