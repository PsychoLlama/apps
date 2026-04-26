import { MemoryRouter, Route } from '@solidjs/router';
import { render } from '@solidjs/testing-library';
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
    const { container } = mount(() => (
      <TabNavRoot aria-label="Primary">
        <TabNavLink href="/">Home</TabNavLink>
      </TabNavRoot>
    ));

    const nav = container.querySelector('nav')!;
    expect(nav.getAttribute('aria-label')).toBe('Primary');
  });

  it('wraps each link in its own <li>', () => {
    const { container } = mount(() => (
      <TabNavRoot aria-label="Primary">
        <TabNavLink href="/a">A</TabNavLink>
        <TabNavLink href="/b">B</TabNavLink>
      </TabNavRoot>
    ));

    const items = container.querySelectorAll('li');
    expect(items.length).toBe(2);
    items.forEach((li) => {
      expect(li.querySelector('a')).toBeTruthy();
    });
  });

  it('marks only the active link with aria-current="page"', () => {
    const { container } = mount(() => (
      <TabNavRoot aria-label="Primary">
        <TabNavLink href="/a">A</TabNavLink>
        <TabNavLink href="/b" active>
          B
        </TabNavLink>
        <TabNavLink href="/c">C</TabNavLink>
      </TabNavRoot>
    ));

    const links = Array.from(container.querySelectorAll('a'));
    const currents = links.filter(
      (link) => link.getAttribute('aria-current') === 'page',
    );
    expect(currents.length).toBe(1);
    expect(currents[0]?.getAttribute('href')).toBe('/b');
  });

  it('renders each link with the expected href on the underlying anchor', () => {
    const { container } = mount(() => (
      <TabNavRoot aria-label="Primary">
        <TabNavLink href="/one">One</TabNavLink>
        <TabNavLink href="/two">Two</TabNavLink>
      </TabNavRoot>
    ));

    const hrefs = Array.from(container.querySelectorAll('a')).map((link) =>
      link.getAttribute('href'),
    );
    expect(hrefs).toEqual(['/one', '/two']);
  });

  it('requires aria-label at the type level', () => {
    expectTypeOf<TabNavRootProps>().toHaveProperty('aria-label');
    // @ts-expect-error — `aria-label` is required.
    const _missing: TabNavRootProps = { children: null };
    void _missing;
  });
});
