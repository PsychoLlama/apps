/**
 * Unit tests for Link.
 *
 * Scope: how `native` is resolved from `href`. A router `<A>` resolves its
 * href against the current route and tags itself with solid-router's
 * `inactive`/`active` class; a native `<a>` does neither, so a schemed URI
 * survives verbatim. We assert on both signals.
 */

import { MemoryRouter, Route } from '@solidjs/router';
import { render, screen } from '@solidjs/testing-library';
import type { Component } from 'solid-js';
import Link from '../link';

const mount = (page: Component) =>
  render(() => (
    <MemoryRouter>
      <Route path="*" component={page} />
    </MemoryRouter>
  ));

// solid-router's `<A>` tags itself with the `inactive` class for a
// non-matching route; a native `<a>` never does. That's our discriminator.
const renderedNatively = (testId: string) =>
  !screen.getByTestId(testId).classList.contains('inactive');

describe('Link', () => {
  it('renders a native anchor for allow-listed schemes, preserving the href verbatim', () => {
    mount(() => (
      <Link testId="link" href="mailto:hi@example.com">
        Email
      </Link>
    ));

    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('href', 'mailto:hi@example.com');
    expect(renderedNatively('link')).toBe(true);
  });

  it.each([
    'tel:+15551234',
    'sms:+15551234',
    'blob:https://example.com/550e8400-uuid',
  ])('infers native for %s', (href) => {
    mount(() => (
      <Link testId="link" href={href}>
        Native
      </Link>
    ));

    expect(screen.getByTestId('link')).toHaveAttribute('href', href);
    expect(renderedNatively('link')).toBe(true);
  });

  it.each([
    '/about',
    'https://example.com',
    '//cdn.example.com/x',
    'javascript:alert(1)',
    'data:text/html,<script>',
  ])('uses the router link for %s', (href) => {
    mount(() => (
      <Link testId="link" href={href}>
        Routed
      </Link>
    ));

    // Everything outside the allow-list — in-app paths, http(s) URLs, and
    // script-executing schemes alike — falls to the router, which neutralizes
    // the dangerous ones instead of rendering a clickable native anchor.
    expect(renderedNatively('link')).toBe(false);
  });

  it('honors an explicit `native` over the inferred default', () => {
    mount(() => (
      <Link testId="link" href="/about" native>
        About
      </Link>
    ));

    expect(renderedNatively('link')).toBe(true);
  });

  it('honors `native={false}` for an allow-listed scheme', () => {
    mount(() => (
      <Link testId="link" href="mailto:hi@example.com" native={false}>
        Email
      </Link>
    ));

    expect(renderedNatively('link')).toBe(false);
  });
});
