import { StaticRouter } from '@solidjs/router';
import type { GalleryListing } from '@dev/gallery';
import Link, { type LinkProps } from './link';

const UNDERLINES = ['auto', 'always', 'hover', 'none'] as const;
const COLORS = ['accent', 'neutral'] as const;
const WEIGHTS = ['light', 'regular', 'medium', 'bold'] as const;

// Each cell gets its own router context so module-level JSX can call Link's
// router primitives. `StaticRouter` (not `MemoryRouter`) keeps this SSR-safe —
// `MemoryRouter` wires up native DOM events on setup, which throws during
// prerender; the gallery is statically generated. An inert hash href keeps the
// showcase links from looking like real routes.
const Demo = (props: LinkProps) => (
  <StaticRouter url="/" root={() => <Link {...props} />} />
);

/**
 * Gallery listing for `Link`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Link',
  render: (props) => <Demo href="#" testId="link" {...props} />,
  sections: [
    {
      title: 'Underline',
      columns: UNDERLINES.map((underline) => ({
        title: underline,
        props: { underline, children: underline },
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
      title: 'Weight',
      columns: WEIGHTS.map((weight) => ({
        title: weight,
        props: { weight, children: weight },
      })),
    },
    {
      title: 'High contrast',
      columns: COLORS.map((color) => ({
        title: color,
        props: { color, highContrast: true, children: color },
      })),
    },
  ],
} satisfies GalleryListing<LinkProps>;
