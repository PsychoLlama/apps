import { Route, StaticRouter } from '@solidjs/router';
import type { GalleryListing } from '@dev/gallery';
import LinkButton, { type LinkButtonProps } from './link-button';

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
      columns: [
        { title: 'Solid', props: { variant: 'solid', children: 'solid' } },
        { title: 'Soft', props: { variant: 'soft', children: 'soft' } },
        {
          title: 'Surface',
          props: { variant: 'surface', children: 'surface' },
        },
        {
          title: 'Outline',
          props: { variant: 'outline', children: 'outline' },
        },
        { title: 'Ghost', props: { variant: 'ghost', children: 'ghost' } },
      ],
    },
    {
      title: 'Color',
      columns: [
        { title: 'Accent', props: { color: 'accent', children: 'accent' } },
        { title: 'Neutral', props: { color: 'neutral', children: 'neutral' } },
        { title: 'Danger', props: { color: 'danger', children: 'danger' } },
        { title: 'Warning', props: { color: 'warning', children: 'warning' } },
        { title: 'Success', props: { color: 'success', children: 'success' } },
      ],
    },
    {
      title: 'Radius',
      columns: [
        { title: 'None', props: { radius: 'none', children: 'none' } },
        { title: 'Small', props: { radius: 'small', children: 'small' } },
        { title: 'Medium', props: { radius: 'medium', children: 'medium' } },
        { title: 'Large', props: { radius: 'large', children: 'large' } },
        { title: 'Full', props: { radius: 'full', children: 'full' } },
      ],
    },
  ],
} satisfies GalleryListing<LinkButtonProps>;
