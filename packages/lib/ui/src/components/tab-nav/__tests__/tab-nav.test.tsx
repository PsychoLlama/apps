import { MemoryRouter, Route } from '@solidjs/router';
import { render } from '@solidjs/testing-library';
import type { Component } from 'solid-js';
import { TabNav, type TabNavRootProps } from '../tab-nav';

const mount = (page: Component) =>
  render(() => (
    <MemoryRouter>
      <Route path="*" component={page} />
    </MemoryRouter>
  ));

describe('TabNav', () => {
  it('renders a navigation landmark with the supplied aria-label', () => {
    const { container } = mount(() => (
      <TabNav.Root aria-label="Primary">
        <TabNav.Link href="/">Home</TabNav.Link>
      </TabNav.Root>
    ));

    const nav = container.querySelector('nav')!;
    expect(nav.getAttribute('aria-label')).toBe('Primary');
  });

  it('wraps each link in its own <li>', () => {
    const { container } = mount(() => (
      <TabNav.Root aria-label="Primary">
        <TabNav.Link href="/a">A</TabNav.Link>
        <TabNav.Link href="/b">B</TabNav.Link>
      </TabNav.Root>
    ));

    const items = container.querySelectorAll('li');
    expect(items.length).toBe(2);
    items.forEach((li) => {
      expect(li.querySelector('a')).toBeTruthy();
    });
  });

  it('marks only the active link with aria-current="page"', () => {
    const { container } = mount(() => (
      <TabNav.Root aria-label="Primary">
        <TabNav.Link href="/a">A</TabNav.Link>
        <TabNav.Link href="/b" active>
          B
        </TabNav.Link>
        <TabNav.Link href="/c">C</TabNav.Link>
      </TabNav.Root>
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
      <TabNav.Root aria-label="Primary">
        <TabNav.Link href="/one">One</TabNav.Link>
        <TabNav.Link href="/two">Two</TabNav.Link>
      </TabNav.Root>
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
