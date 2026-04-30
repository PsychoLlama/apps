/**
 * Iconography for the logo editor's icon picker. Pulls the full MDI
 * manifest straight from `@iconify/json`, so any of the ~7k icons
 * becomes a candidate brandmark — search narrows the visible tile
 * grid.
 */

import mdiManifest from '@iconify/json/json/mdi.json';

interface IconifyIcon {
  body: string;
  hidden?: boolean;
}

interface IconifyManifest {
  width?: number;
  height?: number;
  icons: Record<string, IconifyIcon>;
}

const manifest = mdiManifest as IconifyManifest;

/** A single MDI icon with its raw SVG body (paths use `currentColor`). */
export interface IconEntry {
  /** MDI icon name, kebab-case. */
  name: string;
  /** Inner SVG markup. Always rendered against `ICON_VIEWBOX`. */
  body: string;
}

/** Native viewBox for every icon in the set. */
export const ICON_VIEWBOX = {
  width: manifest.width ?? 24,
  height: manifest.height ?? 24,
} as const;

/**
 * Every renderable icon from the manifest. Hidden entries (deprecated
 * or aliased-only icons MDI keeps for back-compat) are filtered out.
 */
export const ICONS: ReadonlyArray<IconEntry> = Object.entries(manifest.icons)
  .filter(([, def]) => !def.hidden)
  .map(([name, def]) => ({ name, body: def.body }));

const ICONS_BY_NAME = new Map(ICONS.map((entry) => [entry.name, entry]));

/** Look up an icon by name. Returns `undefined` for unknown names. */
export const findIcon = (name: string): IconEntry | undefined =>
  ICONS_BY_NAME.get(name);
