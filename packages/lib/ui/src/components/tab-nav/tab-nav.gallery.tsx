import type { GalleryListing } from '@lib/gallery';
import { Route, StaticRouter } from '@solidjs/router';
import { TabNavLink, TabNavRoot, type TabNavRootProps } from './tab-nav';

// `StaticRouter` (not `MemoryRouter`) gives each cell an SSR-safe router
// context — `MemoryRouter` wires up native DOM events on setup, which throws
// during prerender; the gallery is statically generated.
const Demo = (props: Partial<TabNavRootProps>) => (
  <StaticRouter url="/">
    <Route
      path="*"
      component={() => (
        <TabNavRoot aria-label="Demo navigation" {...props} testId="tab-nav">
          {/* Inert hash hrefs: the static prerender crawls in-app links, so a
              real path here would emit a bogus 200 page at that route. */}
          <TabNavLink href="#" active testId="tab-nav-home">
            Home
          </TabNavLink>
          <TabNavLink href="#" active={false} testId="tab-nav-projects">
            Projects
          </TabNavLink>
          <TabNavLink href="#" active={false} testId="tab-nav-team">
            Team
          </TabNavLink>
        </TabNavRoot>
      )}
    />
  </StaticRouter>
);

/**
 * Gallery listing for `TabNav`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'TabNav',
  render: (props) => <Demo {...props} />,
  sections: [
    {
      title: 'Color',
      columns: [
        { title: 'Accent', props: { color: 'accent' } },
        { title: 'Neutral', props: { color: 'neutral' } },
      ],
    },
    {
      title: 'High contrast',
      columns: [
        { title: 'Accent', props: { color: 'accent', highContrast: true } },
        { title: 'Neutral', props: { color: 'neutral', highContrast: true } },
      ],
    },
  ],
} satisfies GalleryListing<TabNavRootProps>;
