import { StaticRouter } from '@solidjs/router';
import type { Listing } from '#gallery';
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
  group: 'navigation',
  render: (props) => (
    <Demo href="#" testId="link" {...props}>
      Learn more
    </Demo>
  ),
  sections: [
    {
      title: 'Underline',
      columns: [
        { title: 'Auto', props: { underline: 'auto' } },
        { title: 'Always', props: { underline: 'always' } },
        { title: 'Hover', props: { underline: 'hover' } },
        { title: 'None', props: { underline: 'none' } },
      ],
    },
    {
      title: 'Color',
      columns: [
        { title: 'Accent', props: { color: 'accent' } },
        { title: 'Neutral', props: { color: 'neutral' } },
      ],
    },
    {
      title: 'Weight',
      columns: [
        { title: 'Light', props: { weight: 'light' } },
        { title: 'Regular', props: { weight: 'regular' } },
        { title: 'Medium', props: { weight: 'medium' } },
        { title: 'Bold', props: { weight: 'bold' } },
      ],
    },
    {
      title: 'High contrast',
      columns: [
        {
          title: 'Accent',
          props: { color: 'accent', highContrast: true },
        },
        {
          title: 'Neutral',
          props: { color: 'neutral', highContrast: true },
        },
      ],
    },
  ],
} satisfies Listing<LinkProps>;
