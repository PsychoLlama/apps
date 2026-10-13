import type { AssetManifest } from '@dev/nitro-module-asset-manifest/types';

/**
 * Finds the manifest path for a URL path the way Cloudflare does by default
 * (`auto-trailing-slash`): `/about` serves `/about.html`, and `/docs/`
 * serves `/docs/index.html`. Returns `undefined` when nothing matches.
 */
export const resolveAsset = (manifest: AssetManifest, pathname: string) => {
  const path = decodePath(pathname);
  if (path === undefined) return undefined;

  // Cloudflare redirects the other spellings to one canonical URL. Serving
  // them all directly is close enough, and saves a round trip.
  const stem = path.replace(/\/$/, '');
  const candidates = [path, `${stem}.html`, `${stem}/index.html`];

  return candidates.find((candidate) =>
    Object.hasOwn(manifest.assets, candidate),
  );
};

/**
 * Manifest paths are file names, so undo the URL's percent-encoding.
 * `decodeURI` keeps `%2F` encoded, so it can't fake a directory.
 */
const decodePath = (pathname: string) => {
  try {
    return decodeURI(pathname);
  } catch {
    // Malformed escapes can't name a file.
    return undefined;
  }
};
