import type { JSX } from 'solid-js';

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
 * axis `props` and `render` — `satisfies GalleryListing<ComponentProps<typeof
 * TextField>>`. Two sharp edges, both pinned at the call site:
 * - Union prop types (e.g. `ButtonProps`) collapse `Partial<P>` to their shared
 *   keys and break the `render` spread; pin one arm with
 *   `GalleryListing<Extract<ButtonProps, { as?: 'button' }>>`.
 * - Polymorphic props are generic over the tag; pin a concrete one (e.g. the
 *   subset of own props you vary) rather than the generic prop type.
 *
 * `P` is invariant — it appears in both `render`'s parameter and the axis
 * `props` — so the heterogeneous registry erases it to `GalleryListing<unknown>`
 * (`Partial<unknown>` is `{}`, which every concrete listing satisfies);
 * per-listing precision lives at each `satisfies` site.
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
