import { StaticRouter } from '@solidjs/router';
import type { GalleryListing } from '@dev/gallery';
import Link, { type LinkProps } from './link';

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
      columns: [
        { title: 'Auto', props: { underline: 'auto', children: 'auto' } },
        {
          title: 'Always',
          props: { underline: 'always', children: 'always' },
        },
        { title: 'Hover', props: { underline: 'hover', children: 'hover' } },
        { title: 'None', props: { underline: 'none', children: 'none' } },
      ],
    },
    {
      title: 'Color',
      columns: [
        { title: 'Accent', props: { color: 'accent', children: 'accent' } },
        { title: 'Neutral', props: { color: 'neutral', children: 'neutral' } },
      ],
    },
    {
      title: 'Weight',
      columns: [
        { title: 'Light', props: { weight: 'light', children: 'light' } },
        {
          title: 'Regular',
          props: { weight: 'regular', children: 'regular' },
        },
        { title: 'Medium', props: { weight: 'medium', children: 'medium' } },
        { title: 'Bold', props: { weight: 'bold', children: 'bold' } },
      ],
    },
    {
      title: 'High contrast',
      columns: [
        {
          title: 'Accent',
          props: { color: 'accent', highContrast: true, children: 'accent' },
        },
        {
          title: 'Neutral',
          props: { color: 'neutral', highContrast: true, children: 'neutral' },
        },
      ],
    },
  ],
} satisfies GalleryListing<LinkProps>;
