/**
 * Behavioral tests for TabNav. Runs in a real browser via
 * `@vitest/browser` so focus and keyboard semantics match production.
 * DOM-shape coverage stays in the sibling `tab-nav.test.tsx` (jsdom).
 */

import { MemoryRouter, Route } from '@solidjs/router';
import { render, screen } from '@solidjs/testing-library';
import { userEvent } from 'vitest/browser';
import type { JSX } from 'solid-js';
import { TabNavLink, TabNavRoot } from '../tab-nav';

const mount = (page: () => JSX.Element) =>
  render(() => (
    <MemoryRouter>
      <Route path="*" component={page} />
    </MemoryRouter>
  ));

const Nav = () => (
  <TabNavRoot testId="tab-nav" aria-label="Primary navigation">
    <TabNavLink testId="tab-nav-home" href="/" active>
      Home
    </TabNavLink>
    <TabNavLink testId="tab-nav-projects" href="/projects" active={false}>
      Projects
    </TabNavLink>
    <TabNavLink testId="tab-nav-team" href="/team" active={false}>
      Team
    </TabNavLink>
    <TabNavLink testId="tab-nav-settings" href="/settings" active={false}>
      Settings
    </TabNavLink>
  </TabNavRoot>
);

describe('TabNav', () => {
  it('ArrowRight and ArrowDown move focus forward', async () => {
    mount(() => <Nav />);
    const home = screen.getByTestId('tab-nav-home');
    const projects = screen.getByTestId('tab-nav-projects');
    const team = screen.getByTestId('tab-nav-team');

    home.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(projects).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(team).toHaveFocus();
  });

  it('ArrowLeft and ArrowUp move focus backward', async () => {
    mount(() => <Nav />);
    const projects = screen.getByTestId('tab-nav-projects');
    const team = screen.getByTestId('tab-nav-team');
    const settings = screen.getByTestId('tab-nav-settings');

    settings.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(team).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');
    expect(projects).toHaveFocus();
  });

  it('Home jumps to the first link', async () => {
    mount(() => <Nav />);
    const home = screen.getByTestId('tab-nav-home');
    const settings = screen.getByTestId('tab-nav-settings');

    settings.focus();
    await userEvent.keyboard('{Home}');
    expect(home).toHaveFocus();
  });

  it('End jumps to the last link', async () => {
    mount(() => <Nav />);
    const home = screen.getByTestId('tab-nav-home');
    const settings = screen.getByTestId('tab-nav-settings');

    home.focus();
    await userEvent.keyboard('{End}');
    expect(settings).toHaveFocus();
  });

  it('ArrowRight at the last link stays put — no looping', async () => {
    mount(() => <Nav />);
    const settings = screen.getByTestId('tab-nav-settings');

    settings.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(settings).toHaveFocus();
  });

  it('ArrowLeft at the first link stays put — no looping', async () => {
    mount(() => <Nav />);
    const home = screen.getByTestId('tab-nav-home');

    home.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(home).toHaveFocus();
  });
});
