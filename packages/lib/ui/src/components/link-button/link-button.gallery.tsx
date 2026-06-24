import { Route, StaticRouter } from '@solidjs/router';
import type { Listing } from '#gallery';
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
  group: 'navigation',
  render: (props) => (
    <Demo href="/" testId="link-button" {...props}>
      Continue
    </Demo>
  ),
  sections: [
    {
      title: 'Theme colors',
      columns: [
        { title: 'None', props: { radius: 'none' } },
        { title: 'Small', props: { radius: 'small' } },
        { title: 'Medium', props: { radius: 'medium' } },
        { title: 'Large', props: { radius: 'large' } },
        { title: 'Full', props: { radius: 'full' } },
      ],
      rows: [
        { title: 'Solid', props: { variant: 'solid' } },
        { title: 'Soft', props: { variant: 'soft' } },
        { title: 'Surface', props: { variant: 'surface' } },
        { title: 'Outline', props: { variant: 'outline' } },
        { title: 'Ghost', props: { variant: 'ghost' } },
      ],
    },
    {
      title: 'Color',
      columns: [
        { title: 'Accent', props: { color: 'accent' } },
        { title: 'Neutral', props: { color: 'neutral' } },
        { title: 'Danger', props: { color: 'danger' } },
        { title: 'Warning', props: { color: 'warning' } },
        { title: 'Success', props: { color: 'success' } },
      ],
    },
  ],
} satisfies Listing<LinkButtonProps>;
