/**
 * Schemes the router can't resolve — it would mangle them into in-app paths
 * — so they render a native `<a>` by default. An explicit allow-list, not a
 * "has a scheme" test: that keeps script-executing schemes (`javascript:`,
 * `data:`) off the native path entirely. Absolute `http(s)` URLs are
 * intentionally excluded too — the router handles them, and same-origin ones
 * should stay client-routed.
 */
const NATIVE_SCHEME_PATTERN = /^(mailto|tel|sms|blob):/i;

/** Shared opt-in for anchor components that wrap the router's `<A>`. */
export interface NativeProps {
  /**
   * Render a native `<a>` instead of the router link, skipping the router's
   * path resolution. When omitted, inferred from `href`: `mailto:`, `tel:`,
   * `sms:`, and `blob:` default to native, since the router would otherwise
   * resolve them into in-app paths; everything else (including `http(s)`
   * URLs) defaults to the router link. Set explicitly to override. Pair with
   * `target` / `rel` as needed; those pass straight through.
   */
  native?: boolean;
}

export const nativePropKeys = ['native'] as const;

/**
 * Decide whether a link should render a native `<a>`. Honors an explicit
 * `native`, otherwise infers it from the `href` scheme.
 */
export const resolveNative = (
  native: boolean | undefined,
  href: string | undefined,
): boolean => native ?? NATIVE_SCHEME_PATTERN.test(href ?? '');
