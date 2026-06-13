import { Route, StaticRouter } from '@solidjs/router';
import type { GalleryListing } from '@dev/gallery';
import LinkButton, { type LinkButtonProps } from './link-button';

const VARIANTS = ['solid', 'soft', 'surface', 'outline', 'ghost'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

// Each cell gets its own router context so module-level JSX can call
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
  title: 'LinkButton',
  render: (props) => <Demo href="/" testId="link-button" {...props} />,
  sections: [
    {
      title: 'Variant',
      columns: VARIANTS.map((variant) => ({
        title: variant,
        props: { variant, children: variant },
      })),
    },
    {
      title: 'Color',
      columns: COLORS.map((color) => ({
        title: color,
        props: { color, children: color },
      })),
    },
    {
      title: 'Radius',
      columns: RADII.map((radius) => ({
        title: radius,
        props: { radius, children: radius },
      })),
    },
  ],
} satisfies GalleryListing<LinkButtonProps>;
