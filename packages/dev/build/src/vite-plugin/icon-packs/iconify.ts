import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

/**
 * Subset of `@iconify/json/collections.json` we read. The full file
 * carries more fields than we need; declaring the surface keeps
 * `JSON.parse` honest at the type layer.
 */
/** Author metadata as `@iconify/json` exposes it. */
export interface PackAuthor {
  name: string;
  /** Optional homepage / source URL. */
  url?: string;
}

/**
 * License metadata as `@iconify/json` exposes it. All fields are
 * optional in the source — packs ship at varying levels of detail —
 * but in practice every pack we care about provides at least `title`
 * and `spdx`.
 */
export interface PackLicense {
  /** Human-readable label, e.g. `"MIT"` or `"CC BY 4.0"`. */
  title?: string;
  /** SPDX identifier, e.g. `"MIT"` or `"CC-BY-4.0"`. */
  spdx?: string;
  /** Link to the upstream license file or canonical URL. */
  url?: string;
}

export interface CollectionsJson {
  [id: string]: {
    name: string;
    total?: number;
    height?: number;
    samples?: string[];
    /** Iconify's bucket — drives in-app pack ordering. */
    category?: string;
    author?: PackAuthor;
    license?: PackLicense;
  };
}

/** Subset of a per-pack `@iconify/json/json/<id>.json` payload. */
export interface RawPackJson {
  prefix: string;
  width?: number;
  height?: number;
  icons: Record<
    string,
    { body: string; hidden?: boolean; width?: number; height?: number }
  >;
}

const require = createRequire(import.meta.url);

/**
 * Resolve the root of the installed `@iconify/json` package. Uses
 * Node's module resolution so pnpm's hoisted layout (and any other
 * non-sibling install shape) works without a manual walk-up.
 */
export const findIconifyJsonRoot = (): string =>
  path.dirname(require.resolve('@iconify/json/package.json'));

/** Load and parse the pack catalog. */
export const loadCollections = async (
  root: string,
): Promise<CollectionsJson> => {
  const text = await fs.readFile(path.join(root, 'collections.json'), 'utf8');
  return JSON.parse(text) as CollectionsJson;
};

/** Load and parse one pack's icon JSON. */
export const loadRawPack = async (
  root: string,
  id: string,
): Promise<RawPackJson> => {
  const text = await fs.readFile(path.join(root, 'json', `${id}.json`), 'utf8');
  return JSON.parse(text) as RawPackJson;
};
