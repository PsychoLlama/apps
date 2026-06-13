import type { JSX } from 'solid-js';

// ---------------------------------------------------------------------------
// Legacy model — listings as pre-rendered cells. Retained while `*.gallery.tsx`
// files and the `@app/gallery` renderer migrate to the declarative model below.
// No current consumer imports these names directly; drop them once the
// migration lands. (A `@deprecated` tag + export-boundary alias can be added
// when we keep the old `GalleryListing` name working for unmigrated consumers.)
// ---------------------------------------------------------------------------

/** Legacy: a labeled row of pre-rendered component instances. */
export interface DeprecatedGallerySection {
  /** Heading shown above the row. */
  title: string;
  /** One JSX element per cell. Each tag is type-checked against its component. */
  items: ReadonlyArray<JSX.Element>;
}

/** Legacy: a single component's listing as pre-rendered rows. */
export interface DeprecatedGalleryListing {
  /** Display heading. Conventionally the component's name. */
  title: string;
  sections: ReadonlyArray<DeprecatedGallerySection>;
}

// ---------------------------------------------------------------------------
// Declarative model — a listing describes its permutation axes and a
// single-cell `render`; the gallery permutes `columns` × `rows` through it.
// ---------------------------------------------------------------------------

/**
 * One entry on a permutation axis: a header label plus the prop override it
 * contributes to every cell in its column or row.
 */
export interface GalleryAxis<P> {
  /** Header shown for this column or row (e.g. `Primary`, `Classic`). */
  title: string;
  /** Props merged into each cell along this axis. */
  props: Partial<P>;
}

/**
 * One permutation view, surfaced as a tab. The gallery permutes `columns` ×
 * `rows` through the listing's `render`. At least one axis is required — a
 * section with neither is rejected at compile time. Provide only `columns` for
 * column headers, only `rows` for row headers, or both for a full grid.
 */
export type GallerySection<P> = { title: string } & (
  | {
      columns: ReadonlyArray<GalleryAxis<P>>;
      rows?: ReadonlyArray<GalleryAxis<P>>;
    }
  | {
      columns?: ReadonlyArray<GalleryAxis<P>>;
      rows: ReadonlyArray<GalleryAxis<P>>;
    }
);

/**
 * The shape a `*.gallery.tsx` file exports as its default. `render` draws one
 * cell from a merged set of prop overrides; the gallery permutes each section's
 * axes through it and lays the results out in a grid — column/row headers come
 * from the axis titles, and each cell renders at its top-left so instances stay
 * aligned even when their intrinsic sizes differ.
 *
 * Bind `P` to the component's props at the `satisfies` site to type-check the
 * axis `props` and `render` — `satisfies GalleryListing<TextFieldProps>`. Two
 * sharp edges, both pinned at the call site:
 * - Union prop types (e.g. `ButtonProps`) collapse `Partial<P>` to their shared
 *   keys and break the `render` spread; pin one arm with
 *   `GalleryListing<Extract<ButtonProps, { as?: 'button' }>>`.
 * - Polymorphic props are generic over the tag; pin a concrete one with
 *   `GalleryListing<FlexProps<'div'>>`.
 *
 * `P` is invariant — it appears in both `render`'s parameter and the axis
 * `props` — so a heterogeneous registry of listings erases it to
 * `GalleryListing<any>`; per-listing precision lives at each `satisfies` site.
 *
 * Omit `sections` for a component with no variants: `render` is invoked once
 * with no overrides and no tab strip is shown.
 */
export interface GalleryListing<P = Record<string, never>> {
  /** Display heading. Conventionally the component's name (e.g. `TextField`). */
  title: string;

  /**
   * Permutation views, surfaced as tabs (e.g. `Theme Colors`, `All Sizes`).
   * Omit when the component has no variants — the gallery then renders a single
   * cell with no tab strip.
   */
  sections?: ReadonlyArray<GallerySection<P>>;

  /** Render one cell from the merged column + row prop overrides. */
  render: (props: Partial<P>) => JSX.Element;
}

// ---------------------------------------------------------------------------
// Registry — still on the legacy model until the `@app/gallery` renderer
// migrates to permute `GalleryListing` axes. When it does, these flip to the
// erased `GalleryListing<any>` (see the invariance note above).
// ---------------------------------------------------------------------------

/**
 * The shape every package's `src/manifest.gallery.ts` exports as its default.
 * Packages `satisfies`-constrain their literal against this; the registry
 * (`@dev/gallery/manifests`) collects them via a build-time glob.
 */
export interface GalleryManifest {
  /** Display name for the entry. Conventionally the package's name. */
  title: string;

  /** One-line summary of the package, conventionally its `package.json` `description`. */
  description: string;

  /**
   * Deferred import of the package's collected listings. The sibling
   * `gallery-listings.tsx` eagerly globs every `*.gallery.tsx` into one chunk;
   * the manifest defers a single dynamic import of it. A manifest page loads all
   * of its listings in one request, while the deferral keeps them out of the
   * gallery's initial bundle.
   */
  listings: () => Promise<{
    default: ReadonlyArray<DeprecatedGalleryListing>;
  }>;
}

/**
 * Collect an eager `import.meta.glob` of a package's `*.gallery.tsx` modules
 * into a listing array — each module's default export is its listing. A
 * package's `gallery-listings.tsx` calls this so its manifest can defer a
 * single import that loads every listing at once.
 */
export const collectListings = (
  modules: Record<string, { default: DeprecatedGalleryListing }>,
): DeprecatedGalleryListing[] =>
  Object.values(modules).map((module) => module.default);
