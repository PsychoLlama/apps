/**
 * Quote component.
 *
 * Ported from Radix UI Themes Quote. Deviations:
 * - No `asChild`. Tag-locked to `<q>`. The browser supplies the
 *   surrounding smart quotes via the `quotes` UA stylesheet.
 * - No font-style / font-family / font-weight theming knobs. Italic
 *   inherits metrics from the surrounding text.
 *
 * @see https://www.radix-ui.com/themes/docs/components/quote
 */

import { splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import {
  type SkeletonProps,
  skeletonPropKeys,
  useSkeleton,
} from '../../props/skeleton';
import { testIdPropKeys, type TestIdProps } from '../../props/test-id';
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
import * as css from './quote.css';

export interface QuoteProps
  extends
    MarginProps,
    TruncateProps,
    WrapProps,
    SkeletonProps,
    TestIdProps,
    JSX.HTMLAttributes<HTMLQuoteElement> {}

/** Short inline quotation. Renders a `<q>`; the browser supplies surrounding quote marks. */
const Quote: ParentComponent<QuoteProps> = (rawProps) => {
  const [margin, withoutMargin] = splitProps(rawProps, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'class',
    'children',
    ...truncatePropKeys,
    ...wrapPropKeys,
    ...skeletonPropKeys,
  ]);
  const [skeletonClass, skeletonProps] = useSkeleton(local, rest);

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.base,
      !local.truncate && resolveWrapClass(local),
      resolveTruncateClass(local),
      skeletonClass(),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <q class={className()} data-testid={tid.testId} {...skeletonProps}>
      {local.children}
    </q>
  );
};

export default Quote;
