/**
 * Callout component.
 *
 * Ported from Radix UI Themes Callout. Simplified to a single component
 * with an optional `icon` prop instead of compound Root/Icon/Text.
 *
 * @see https://www.radix-ui.com/themes/docs/components/callout
 */

import { mergeProps, splitProps } from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
import IconInformation from 'virtual:icons/mdi/information-outline';
import {
  marginPropKeys,
  resolveMarginClasses,
  type MarginProps,
} from '../../props/margin';
import { type SkeletonProps, skeletonPropKeys } from '../../props/skeleton';
import { testIdPropKeys, type TestIdProps } from '../../props/test-id';
import Flex from '../flex/flex';
import * as css from './callout.css';

const rootGap = { 1: 2, 2: 3, 3: 4 } as const;
const contentGap = { 1: 2, 2: 2, 3: 3 } as const;

type Size = 1 | 2 | 3;
type Variant = 'soft' | 'surface' | 'outline';
type Color = 'accent' | 'neutral' | 'danger' | 'warning' | 'success';

export interface CalloutProps
  extends
    MarginProps,
    SkeletonProps,
    TestIdProps,
    JSX.HTMLAttributes<HTMLDivElement> {
  /** Visual size on a 1–3 scale. @default 2 */
  size?: Size;
  /** Visual treatment. @default 'soft' */
  variant?: Variant;
  /** Semantic color. @default 'accent' */
  color?: Color;
  /** Use high-contrast text for stronger emphasis. @default false */
  highContrast?: boolean;
  /** Icon element displayed before the text. @default info icon */
  icon?: JSX.Element;
}

/** Informational container with an optional icon. Multiple children stack vertically alongside the icon. */
const Callout: ParentComponent<CalloutProps> = (rawProps) => {
  const props = mergeProps(
    {
      size: 2 as const,
      variant: 'soft' as const,
      color: 'accent' as const,
      highContrast: false,
    },
    rawProps,
  );
  const [margin, withoutMargin] = splitProps(props, [...marginPropKeys]);
  const [tid, withoutTid] = splitProps(withoutMargin, [...testIdPropKeys]);
  const [skel, withoutSkel] = splitProps(withoutTid, [...skeletonPropKeys]);
  const [local, rest] = splitProps(withoutSkel, [
    'size',
    'variant',
    'color',
    'highContrast',
    'icon',
    'class',
    'children',
  ]);

  const contrast = () => (local.highContrast ? 'high' : 'normal');

  const className = () =>
    [
      ...resolveMarginClasses(margin),
      css.size[local.size],
      css.variantColor[local.variant][local.color][contrast()],
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <Flex
      as="div"
      align="start"
      gap={rootGap[local.size]}
      class={className()}
      role="note"
      testId={tid.testId}
      skeleton={skel.skeleton}
      {...rest}
    >
      <Flex as="div" align="center" class={css.iconSize[local.size]}>
        {local.icon ?? <IconInformation />}
      </Flex>
      <Flex
        as="div"
        direction="column"
        gap={contentGap[local.size]}
        class={css.content}
      >
        {local.children}
      </Flex>
    </Flex>
  );
};

export default Callout;
