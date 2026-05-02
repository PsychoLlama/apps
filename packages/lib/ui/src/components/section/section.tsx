/**
 * Section component.
 *
 * Ported from Radix UI Themes Section. Tag-locked to `<section>` for
 * landmark semantics. Pads vertically to set page rhythm; pair with
 * `<Container>` to cap horizontal width.
 *
 * Deviations:
 * - Tag-locked (no `as` prop) to preserve the landmark role.
 * - No responsive object props or `display` prop.
 *
 * @see https://www.radix-ui.com/themes/docs/components/section
 */

import { mergeProps, splitProps } from 'solid-js';
import type { Component, JSX } from 'solid-js';
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
import * as css from './section.css';

type SectionSize = 1 | 2 | 3 | 4;

/** Section-specific layout props. */
interface SectionOwnProps {
  /** Vertical padding preset. @default 3 */
  size?: SectionSize;
}

/** Section props. */
export type SectionProps = SectionOwnProps &
  MarginProps &
  SkeletonProps &
  TestIdProps &
  JSX.HTMLAttributes<HTMLElement>;

/** Landmark `<section>` with vertical padding for page rhythm. */
const Section: Component<SectionProps> = (rawProps) => {
  const props = mergeProps({ size: 3 as const }, rawProps);
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'size',
    'class',
    'children',
    ...skeletonPropKeys,
  ]);
  const [skeletonClass, skeletonProps] = useSkeleton(local, rest);

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.base,
      css.size[local.size],
      skeletonClass(),
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <section class={className()} data-testid={tid.testId} {...skeletonProps}>
      {local.children}
    </section>
  );
};

export default Section;
