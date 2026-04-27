/**
 * Unit tests for TabNav.
 *
 * Scope: DOM-shape and type-level assertions. TabNav is a routing strip
 * with no internal interaction beyond what the anchor + router give
 * you, so there's nothing to move to Storybook today. If we ever add
 * keyboard-driven behavior (e.g. arrow nav between links), that goes
 * to a Storybook play function — see `packages/dev/storybook/src/
 * stories/ui/components/tabs.stories.tsx` for the pattern.
 */

import { MemoryRouter, Route } from '@solidjs/router';
import { render, screen } from '@solidjs/testing-library';
import type { Component } from 'solid-js';
import { TabNavLink, TabNavRoot, type TabNavRootProps } from '../tab-nav';

const mount = (page: Component) =>
  render(() => (
    <MemoryRouter>
      <Route path="*" component={page} />
    </MemoryRouter>
  ));

describe('TabNav', () => {
  it('renders a navigation landmark with the supplied aria-label', () => {
    mount(() => (
      <TabNavRoot testId="nav" aria-label="Primary">
        <TabNavLink testId="nav-home" href="/">
          Home
        </TabNavLink>
      </TabNavRoot>
    ));

    expect(screen.getByTestId('nav')).toHaveAttribute('aria-label', 'Primary');
  });

  it('wraps each link in its own <li>', () => {
    mount(() => (
      <TabNavRoot testId="nav" aria-label="Primary">
        <TabNavLink testId="nav-a" href="/a">
          A
        </TabNavLink>
        <TabNavLink testId="nav-b" href="/b">
          B
        </TabNavLink>
      </TabNavRoot>
    ));

    const linkA = screen.getByTestId('nav-a');
    const linkB = screen.getByTestId('nav-b');
    expect(linkA.parentElement?.tagName).toBe('LI');
    expect(linkB.parentElement?.tagName).toBe('LI');
  });

  it('marks only the active link with aria-current="page"', () => {
    mount(() => (
      <TabNavRoot testId="nav" aria-label="Primary">
        <TabNavLink testId="nav-a" href="/a">
          A
        </TabNavLink>
        <TabNavLink testId="nav-b" href="/b" active>
          B
        </TabNavLink>
        <TabNavLink testId="nav-c" href="/c">
          C
        </TabNavLink>
      </TabNavRoot>
    ));

    expect(screen.getByTestId('nav-a')).not.toHaveAttribute('aria-current');
    expect(screen.getByTestId('nav-b')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('nav-c')).not.toHaveAttribute('aria-current');
  });

  it('renders each link with the expected href on the underlying anchor', () => {
    mount(() => (
      <TabNavRoot testId="nav" aria-label="Primary">
        <TabNavLink testId="nav-one" href="/one">
          One
        </TabNavLink>
        <TabNavLink testId="nav-two" href="/two">
          Two
        </TabNavLink>
      </TabNavRoot>
    ));

    expect(screen.getByTestId('nav-one')).toHaveAttribute('href', '/one');
    expect(screen.getByTestId('nav-two')).toHaveAttribute('href', '/two');
  });

  it('requires aria-label at the type level', () => {
    expectTypeOf<TabNavRootProps>().toHaveProperty('aria-label');
    // @ts-expect-error — `aria-label` is required.
    const _missing: TabNavRootProps = { testId: 'nav', children: null };
    void _missing;
  });
});
