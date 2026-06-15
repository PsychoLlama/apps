---
description: Reference docs for the design-system gallery — the `*.gallery.tsx` listing model (`@lib/gallery`) and its renderer (`@app/gallery`). Load when authoring or reviewing a gallery listing or looking up the listing/section/axis API.
---

# Gallery

- Two packages: `@lib/gallery` (the listing model — types only) and `@app/gallery` (the renderer — layout, home, manifest routes).
- A listing is a `*.gallery.tsx` file co-located with its component or token. It declares permutation axes and a single-cell `render`; the gallery permutes `columns × rows` through it into a labeled grid.
- Listings are the one place outside `@lib/ui` where Solid primitives (`createSignal`, `createStore`, `createMemo`) are allowed — interactive demos need local state.

## Authoring a listing

- Default-export an object typed with `satisfies GalleryListing<P>`. Bind `P` to the component's props at the `satisfies` site so axis `props` and `render` type-check.
- Co-locate: `lib/ui/src/components/<name>/<name>.gallery.tsx`. Tokens consolidate under `lib/design/src/gallery/<token>.gallery.tsx`. Optional styles: `<name>.gallery.css.ts`.

```tsx
import type { GalleryListing } from '@lib/gallery';
import Button, { type ButtonProps } from './button';

export default {
  title: 'Button',
  render: (props) => (
    <Button as="button" testId="button" {...props}>
      Continue
    </Button>
  ),
  sections: [
    {
      title: 'Theme colors',
      columns: [
        { title: 'Solid', props: { variant: 'solid' } },
        { title: 'Soft', props: { variant: 'soft' } },
      ],
      rows: [
        { title: 'Default', props: {} },
        { title: 'Disabled', props: { disabled: true } },
      ],
    },
  ],
} satisfies GalleryListing<Extract<ButtonProps, { as?: 'button' }>>;
```

- No variants? Omit `sections`. `render` is invoked once with no overrides.

## API: `@lib/gallery`

### `GalleryListing<P = Record<string, never>>`

- `title: string` — display heading, conventionally the component name.
- `sections?: ReadonlyArray<GallerySection<P>>` — permutation views surfaced as tabs. Omit for variant-free components.
- `render: (props: Partial<P>) => JSX.Element` — draws one cell from the merged column + row overrides. Cells render top-left so instances stay aligned across differing sizes.

### `GallerySection<P>`

- `title: string` — tab label.
- `columns?: ReadonlyArray<GalleryAxis<P>>`, `rows?: ReadonlyArray<GalleryAxis<P>>`.
- `gap?: SectionGap` (1–9) — overrides the inter-cell grid gap. Leave unset unless requested.
- `align?: { rows?: SectionAlign; columns?: SectionAlign }` — cell alignment within tracks. `rows` is the block (vertical) axis, `columns` the inline (horizontal) axis; both default to `start`. Leave unset unless requested.

### `GalleryAxis<P>`

- `title: string` — column/row header (e.g. `Primary`, `Disabled`).
- `props: Partial<P>` — props merged into every cell along this axis.

### Aliases

- `SectionGap = 1 | … | 9`.
- `SectionAlign = 'start' | 'center' | 'end' | 'stretch'`.

## Typing `P` — two sharp edges

- Union prop types (e.g. `ButtonProps` over `as`) collapse `Partial<P>` to shared keys and break the `render` spread. Pin one arm: `GalleryListing<Extract<ButtonProps, { as?: 'button' }>>`.
- Polymorphic props are generic over the tag. Pin a concrete subset (the own props you vary) rather than the generic prop type.
- `P` is invariant, so the renderer's registry erases it to `GalleryListing<unknown>`. Per-listing precision lives at each `satisfies` site.

## API: `@app/gallery`

- `Gallery` — layout wrapping every `/gallery/*` route.
- `GalleryHome` — landing page listing the manifests.
- `ManifestRoute` — renders one package's listings on `/gallery/<slug>`. Props: `title`, `description`, `listings: Record<string, { default: GalleryListing<unknown> }>` (an eager glob).
- Re-exports `GalleryListing` type from `@lib/gallery`.

## Adding a package to the gallery

1. Write `*.gallery.tsx` listings co-located in the package.
2. Add a route at `app/main/src/routes/gallery/<slug>.tsx` that renders `ManifestRoute`, feeding it an eager `import.meta.glob<{ default: GalleryListing<unknown> }>('…/**/*.gallery.tsx', { eager: true })`. Eager so SolidStart preloads listings with the route (no flash).
3. Register a `manifest(name, description)` entry in `app/gallery/src/manifests.ts`. Add the route file and the manifest entry together — the slug must match.
4. Slug rule (`manifestSlug`): drop leading `@`, swap `/` for `-` (`@lib/ui` → `lib-ui`).

## Authoring Rules

- Keep components consistent between variants. Only vary the properties being tested.
- When values are required, use examples that are plausibly found in real applications.
- Always specify your own sentence cased title, e.g. `value="neutral" title="Neutral"`.
- For numeric permutations, avoid text titles; show `2` instead of `Size 2`.
- Only create sections if they represent distinct visual properties. Features like `selectable` do not warrant their own section.
