/**
 * Wiring tests for LinkButton.
 *
 * The scheme matrix is covered in `props/__tests__/native.test.ts`; here we
 * only assert LinkButton routes its `href` through that detector, matching
 * Link's `native` behavior. A router `<A>` tags itself with solid-router's
 * `inactive` class for a non-matching route; a native `<a>` never does —
 * that's our discriminator.
 */

import { MemoryRouter, Route } from '@solidjs/router';
import { render, screen } from '@solidjs/testing-library';
import type { Component } from 'solid-js';
import LinkButton from '../link-button';

const mount = (page: Component) =>
  render(() => (
    <MemoryRouter>
      <Route path="*" component={page} />
    </MemoryRouter>
  ));

const renderedNatively = (testId: string) =>
  !screen.getByTestId(testId).classList.contains('inactive');

describe('LinkButton', () => {
  it('renders a native anchor for an inferred scheme, preserving the href verbatim', () => {
    mount(() => (
      <LinkButton testId="link" href="mailto:hi@example.com">
        Email
      </LinkButton>
    ));

    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('href', 'mailto:hi@example.com');
    expect(renderedNatively('link')).toBe(true);
  });

  it('renders the router link for an in-app path', () => {
    mount(() => (
      <LinkButton testId="link" href="/about">
        About
      </LinkButton>
    ));

    expect(renderedNatively('link')).toBe(false);
  });

  it('honors an explicit `native` over the inferred default', () => {
    mount(() => (
      <LinkButton testId="link" href="/about" native>
        About
      </LinkButton>
    ));

    expect(renderedNatively('link')).toBe(true);
  });
});
