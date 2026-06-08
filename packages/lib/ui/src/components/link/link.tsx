/**
 * Link component.
 *
 * Ported from Radix UI Themes Link. Renders `<A>` from `@solidjs/router`
 * for client-side routing, or a native `<a>` for destinations that aren't
 * in-app routes — anything carrying a URI scheme (`mailto:`, `tel:`,
 * `https:`) or a protocol-relative `//`, which the router would otherwise
 * mangle into in-app paths. Inferred from `href` by default; override with
 * `native`. Only supports accent and neutral colors.
 *
 * @see https://www.radix-ui.com/themes/docs/components/link
 */

import { A, type AnchorProps } from '@solidjs/router';
import { mergeProps, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type { ParentComponent } from 'solid-js';
import type { FontWeight, TypeScale } from '@lib/design';
import {
  type MarginProps,
  marginPropKeys,
  resolveMarginClasses,
} from '../../props/margin';
import {
  type TrimProps,
  trimPropKeys,
  resolveTrimClass,
} from '../../props/trim';
import {
  type TruncateProps,
  truncatePropKeys,
  resolveTruncateClass,
} from '../../props/truncate';
import {
  type WrapProps,
  wrapPropKeys,
  resolveWrapClass,
} from '../../props/wrap';
import {
  type SkeletonProps,
  skeletonPropKeys,
  useSkeleton,
} from '../../props/skeleton';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import * as css from './link.css';

type LinkColor = 'accent' | 'neutral';
type Underline = 'auto' | 'always' | 'hover' | 'none';

/**
 * Destinations the router can't resolve: a leading URI scheme (`mailto:`,
 * `tel:`, `https:`) or a protocol-relative `//`. These render a native `<a>`.
 */
const NON_ROUTE_PATTERN = /^([a-z][a-z\d+.-]*:|\/\/)/i;

export interface LinkProps
  extends
    MarginProps,
    TrimProps,
    TruncateProps,
    WrapProps,
    SkeletonProps,
    RequiredTestIdProps,
    AnchorProps {
  /** Visual size on a 1–9 scale. Inherits from parent when omitted. */
  size?: TypeScale;
  /** Font weight. */
  weight?: FontWeight;
  /** Underline behavior. @default 'auto' */
  underline?: Underline;
  /** Semantic color. @default 'accent' */
  color?: LinkColor;
  /** Use high-contrast text for stronger emphasis. @default false */
  highContrast?: boolean;
  /**
   * Render a native `<a>` instead of the router link, skipping the router's
   * path resolution. When omitted, inferred from `href`: destinations with a
   * URI scheme (`mailto:`, `tel:`, `https:`) or a protocol-relative `//`
   * default to native, since the router would otherwise resolve them into
   * in-app paths; in-app paths default to the router link. Set explicitly to
   * override. Pair with `target` / `rel` as needed; those pass straight
   * through.
   */
  native?: boolean;
}

/** Inline navigation link for in-app routing. */
const Link: ParentComponent<LinkProps> = (rawProps) => {
  const props = mergeProps(
    {
      underline: 'auto' as const,
      color: 'accent' as const,
      highContrast: false,
    },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'size',
    'weight',
    'underline',
    'color',
    'highContrast',
    'native',
    'class',
    'children',
    ...trimPropKeys,
    ...truncatePropKeys,
    ...wrapPropKeys,
    ...skeletonPropKeys,
  ]);
  const [skeletonClass, skeletonProps] = useSkeleton(local, rest);

  const contrast = () => (local.highContrast ? 'high' : 'normal');

  // Honor an explicit `native`, otherwise infer it from the destination.
  const native = () => local.native ?? NON_ROUTE_PATTERN.test(props.href ?? '');

  const autoAlways = () =>
    local.underline === 'auto' &&
    (local.highContrast || local.color === 'neutral');

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.base,
      local.size && css.size[local.size],
      local.weight && css.weight[local.weight],
      css.color[local.color][contrast()],
      css.underline[local.underline],
      autoAlways() && css.underlineAutoAlways,
      resolveTrimClass(local),
      !local.truncate && resolveWrapClass(local),
      resolveTruncateClass(local),
      skeletonClass(),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <Dynamic
      component={native() ? 'a' : A}
      class={className()}
      data-testid={tid.testId}
      {...skeletonProps}
    >
      {local.children}
    </Dynamic>
  );
};

export default Link;
