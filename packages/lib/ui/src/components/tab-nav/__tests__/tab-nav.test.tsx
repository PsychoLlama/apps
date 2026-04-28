/**
 * Unit tests for TabNav.
 *
 * Scope: DOM-shape assertions only. Behavioral coverage (keyboard nav)
 * lives in Storybook play functions, where focus and event semantics
 * behave like a real browser.
 */

import { MemoryRouter, Route } from '@solidjs/router';
import { render, screen } from '@solidjs/testing-library';
import type { Component } from 'solid-js';
import { TabNavLink, TabNavRoot } from '../tab-nav';

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
        <TabNavLink testId="nav-home" href="/" active={false}>
          Home
        </TabNavLink>
      </TabNavRoot>
    ));

    expect(screen.getByTestId('nav')).toHaveAttribute('aria-label', 'Primary');
  });

  it('wraps each link in its own <li>', () => {
    mount(() => (
      <TabNavRoot testId="nav" aria-label="Primary">
        <TabNavLink testId="nav-a" href="/a" active={false}>
          A
        </TabNavLink>
        <TabNavLink testId="nav-b" href="/b" active={false}>
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
        <TabNavLink testId="nav-a" href="/a" active={false}>
          A
        </TabNavLink>
        <TabNavLink testId="nav-b" href="/b" active>
          B
        </TabNavLink>
        <TabNavLink testId="nav-c" href="/c" active={false}>
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
        <TabNavLink testId="nav-one" href="/one" active={false}>
          One
        </TabNavLink>
        <TabNavLink testId="nav-two" href="/two" active={false}>
          Two
        </TabNavLink>
      </TabNavRoot>
    ));

    expect(screen.getByTestId('nav-one')).toHaveAttribute('href', '/one');
    expect(screen.getByTestId('nav-two')).toHaveAttribute('href', '/two');
  });
});
