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

describe('Link', () => {
  it('renders a native anchor for schemed URIs, preserving the href verbatim', () => {
    mount(() => (
      <Link testId="link" href="mailto:hi@example.com">
        Email
      </Link>
    ));

    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('href', 'mailto:hi@example.com');
    expect(link.classList.contains('inactive')).toBe(false);
  });

  it.each(['tel:+15551234', 'https://example.com', '//cdn.example.com/x'])(
    'infers native for %s',
    (href) => {
      mount(() => (
        <Link testId="link" href={href}>
          External
        </Link>
      ));

      const link = screen.getByTestId('link');
      expect(link).toHaveAttribute('href', href);
      expect(link.classList.contains('inactive')).toBe(false);
    },
  );

  it('uses the router link for in-app paths', () => {
    mount(() => (
      <Link testId="link" href="/about">
        About
      </Link>
    ));

    // solid-router's `<A>` tags itself with the inactive class; a native
    // `<a>` would not.
    expect(screen.getByTestId('link').classList.contains('inactive')).toBe(
      true,
    );
  });

  it('honors an explicit `native` over the inferred default', () => {
    mount(() => (
      <Link testId="link" href="/about" native>
        About
      </Link>
    ));

    expect(screen.getByTestId('link').classList.contains('inactive')).toBe(
      false,
    );
  });

  it('honors `native={false}` for a schemed URI', () => {
    mount(() => (
      <Link testId="link" href="mailto:hi@example.com" native={false}>
        Email
      </Link>
    ));

    // Forced through the router, which tags itself with the inactive class.
    expect(screen.getByTestId('link').classList.contains('inactive')).toBe(
      true,
    );
  });
});
