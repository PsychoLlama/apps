import { Route, StaticRouter } from '@solidjs/router';
import type { GalleryListing } from '@dev/gallery';
import LinkButton, { type LinkButtonProps } from './link-button';

const VARIANTS = ['solid', 'soft', 'surface', 'outline', 'ghost'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

const defaults = { href: '/', testId: 'link-button' } as const;

// Each gallery item gets its own router context so module-level JSX can call
// LinkButton's router primitives. `StaticRouter` (not `MemoryRouter`) keeps this
// SSR-safe — `MemoryRouter` wires up native DOM events on setup, which throws
// during prerender; the gallery is statically generated.
const Demo = (props: LinkButtonProps) => (
  <StaticRouter url="/">
    <Route path="*" component={() => <LinkButton {...props} />} />
  </StaticRouter>
);

/**
 * Gallery listing for `LinkButton`. Enumerates the component across its
 * visual axes.
 */
export default {
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <Demo {...defaults} variant={variant}>
          {variant}
        </Demo>
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Demo {...defaults} color={color}>
          {color}
        </Demo>
      )),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => (
        <Demo {...defaults} radius={radius}>
          {radius}
        </Demo>
      )),
    },
  ],
} satisfies GalleryListing;
