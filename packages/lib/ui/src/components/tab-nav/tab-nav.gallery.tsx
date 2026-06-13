import type { GalleryListing } from '@dev/gallery';
import { Route, StaticRouter } from '@solidjs/router';
import { TabNavLink, TabNavRoot, type TabNavRootProps } from './tab-nav';

const SIZES = [1, 2] as const;
const COLORS = ['accent', 'neutral'] as const;

// `StaticRouter` (not `MemoryRouter`) gives each item an SSR-safe router
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
  sections: [
    {
      title: 'Size',
      items: SIZES.map((size) => <Demo size={size} />),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => <Demo color={color} />),
    },
    {
      title: 'High contrast',
      items: COLORS.map((color) => <Demo color={color} highContrast />),
    },
  ],
} satisfies GalleryListing;
