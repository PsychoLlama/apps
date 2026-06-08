/**
 * Unit tests for `resolveNative` — the shared detector behind `<Link>` and
 * `<LinkButton>`'s `native` prop. It decides whether a link renders a native
 * `<a>` (verbatim href) or the router's `<A>` (path resolution).
 */

import { resolveNative } from '../native';

describe('resolveNative', () => {
  it.each([
    'mailto:hi@example.com',
    'tel:+15551234',
    'sms:+15551234',
    'blob:https://example.com/uuid',
  ])('infers native for the allow-listed scheme %s', (href) => {
    expect(resolveNative(undefined, href)).toBe(true);
  });

  it.each([
    '/about',
    'https://example.com',
    '//cdn.example.com/x',
    'javascript:alert(1)',
    'data:text/html,<script>',
  ])('infers the router link for %s', (href) => {
    // Everything outside the allow-list — in-app paths, http(s) URLs, and
    // script-executing schemes alike — falls to the router, which neutralizes
    // the dangerous ones instead of rendering a clickable native anchor.
    expect(resolveNative(undefined, href)).toBe(false);
  });

  it('treats a missing href as non-native', () => {
    expect(resolveNative(undefined, undefined)).toBe(false);
  });

  it('honors an explicit `native` over the inferred default', () => {
    expect(resolveNative(true, '/about')).toBe(true);
    expect(resolveNative(false, 'mailto:hi@example.com')).toBe(false);
  });
});
