import { StaticRouter } from '@solidjs/router';
import type { GalleryListing } from '@dev/gallery';
import Link, { type LinkProps } from './link';

const UNDERLINES = ['auto', 'always', 'hover', 'none'] as const;
const COLORS = ['accent', 'neutral'] as const;
const WEIGHTS = ['light', 'regular', 'medium', 'bold'] as const;

// An inert hash href keeps the showcase links from looking like real routes:
// the static prerender crawls in-app links, and a real path here would emit a
// bogus 200 page at that route.
const defaults = { href: '#', testId: 'link' } as const;

// Each gallery item gets its own router context so module-level JSX can call
// Link's router primitives. `StaticRouter` (not `MemoryRouter`) keeps this
// SSR-safe — `MemoryRouter` wires up native DOM events on setup, which throws
// during prerender; the gallery is statically generated.
const Demo = (props: LinkProps) => (
  <StaticRouter url="/" root={() => <Link {...props} />} />
);

/**
 * Gallery listing for `Link`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Link',
  sections: [
    {
      title: 'Underline',
      items: UNDERLINES.map((underline) => (
        <Demo {...defaults} underline={underline}>
          {underline}
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
      title: 'Weight',
      items: WEIGHTS.map((weight) => (
        <Demo {...defaults} weight={weight}>
          {weight}
        </Demo>
      )),
    },
    {
      title: 'High contrast',
      items: COLORS.map((color) => (
        <Demo {...defaults} color={color} highContrast>
          {color}
        </Demo>
      )),
    },
  ],
} satisfies GalleryListing;
