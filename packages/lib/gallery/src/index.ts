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
 * Spacing step for a section's grid gap, mirroring `@lib/design`'s `SpaceScale`
 * (1–9). Duplicated rather than imported: `@lib/design` hosts gallery listings
 * and already depends on this package, so importing its tokens back would form a
 * dependency cycle.
 */
export type SectionGap = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * Alignment of a cell within its grid track, mirroring `@lib/ui`'s Grid
 * `align`/`justify`. Duplicated rather than imported: `@lib/ui` ships gallery
 * listings and already depends on this package, so importing it back would form
 * a dependency cycle.
 */
export type SectionAlign = 'start' | 'center' | 'end' | 'stretch';

/**
 * One permutation view, surfaced as a tab. The gallery permutes `columns` ×
 * `rows` through the listing's `render`. At least one axis is required — a
 * section with neither is rejected at compile time. Provide only `columns` for
 * column headers, only `rows` for row headers, or both for a full grid.
 */
export type GallerySection<P> = {
  title: string;
  /**
   * Overrides the grid gap between cells on both axes. Defaults to the
   * gallery's standard spacing — set a tighter step for dense cells like color
   * swatches.
   */
  gap?: SectionGap;
  /**
   * Aligns each cell within its track. `rows` runs the block (vertical) axis,
   * `columns` the inline (horizontal) axis; both default to `start`. Set
   * `center` to center headers over their cells.
   */
  align?: { rows?: SectionAlign; columns?: SectionAlign };
} & (
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
 * `props` — so the heterogeneous registry erases it to `GalleryListing<unknown,
 * string>` (`Partial<unknown>` is `{}`, which every concrete listing satisfies);
 * per-listing precision lives at each `satisfies` site.
 *
 * Omit `sections` for a component with no variants: `render` is invoked once
 * with no overrides and no tab strip is shown.
 *
 * `GroupIds` is the union of group ids the listing may belong to (see {@link
 * GalleryGroup}). It defaults to `never` — the package declares no groups, so
 * `group` is forbidden — and is bound per package by a `Listing` alias built
 * from {@link GalleryGroupId}, which makes `group` a *required*, id-constrained
 * field. Renaming a group id then ripples to every listing in that package at
 * compile time. The gallery app widens it back to `string` for its
 * heterogeneous registry.
 */
export type GalleryListing<
  P = Record<string, never>,
  GroupIds extends string = never,
> = GalleryListingFields<P> & GalleryGroupField<GroupIds>;

/** The fields every listing carries, independent of its package's groups. */
interface GalleryListingFields<P> {
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

/**
 * A listing's `group` field, shaped by its package's declared group ids:
 * required and constrained to those ids when the package has groups, forbidden
 * when it declares none (`GroupIds` is `never`).
 */
type GalleryGroupField<GroupIds extends string> = [GroupIds] extends [never]
  ? {
      /** This package declares no groups, so `group` must be omitted. */
      group?: never;
    }
  : {
      /**
       * The group this listing belongs to, referenced by id. Constrained to the
       * host package's declared {@link GalleryGroup} ids.
       */
      group: GroupIds;
    };

/**
 * A named bucket a package's listings can be sorted into. Referenced by `id`
 * (stable, used in each listing's `group`), rendered by `label`. Groups are
 * scoped to the package that declares them via {@link defineGallery} — one
 * package's ids are not valid in another.
 */
export interface GalleryGroup {
  /** Stable reference key, used by a listing's `group` (e.g. `typography`). */
  id: string;
  /** Human-facing heading rendered for the group (e.g. `Typography`). */
  label: string;
}

/**
 * A package's gallery metadata: the manifest title/description the gallery app
 * surfaces, plus the {@link GalleryGroup} set its listings may reference.
 * Authored once per package via {@link defineGallery}.
 */
export interface GalleryManifest<
  G extends ReadonlyArray<GalleryGroup> = ReadonlyArray<GalleryGroup>,
> {
  /** Manifest title, conventionally the package name (`@lib/ui`). */
  name: string;
  /** One-line summary of the package, shown on the manifest's card. */
  description: string;
  /** The groups this package's listings may belong to. Empty for none. */
  groups: G;
}

/**
 * The union of group ids a {@link defineGallery} manifest declares — `never`
 * when it declares none. Feed `GalleryGroupId<typeof gallery>` as a {@link
 * GalleryListing}'s `GroupIds` to bind each listing's `group` to exactly this
 * package's set.
 */
export type GalleryGroupId<Manifest extends GalleryManifest> =
  Manifest['groups'][number]['id'];

/**
 * Declare a package's gallery manifest. Each package owns a `gallery.ts` module
 * that calls this and default-exports the result, then derives its bound
 * listing type from the captured groups via {@link GalleryGroupId}:
 *
 * ```ts
 * const gallery = defineGallery({
 *   name: '@lib/ui',
 *   description: 'Shared component library.',
 *   groups: [{ id: 'typography', label: 'Typography' }],
 * });
 * export default gallery;
 * export type Listing<P = Record<string, never>> =
 *   GalleryListing<P, GalleryGroupId<typeof gallery>>;
 * ```
 *
 * The `const` type parameter preserves the literal group ids so the derived
 * `Listing` alias constrains each `group` to exactly this package's set.
 */
export const defineGallery = <const G extends ReadonlyArray<GalleryGroup>>(
  manifest: GalleryManifest<G>,
): GalleryManifest<G> => manifest;
