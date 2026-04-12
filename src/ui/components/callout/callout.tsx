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
import Flex from '../flex/flex';
import Grid from '../grid/grid';
import Text from '../text/text';
import * as css from './callout.css';

type Size = 1 | 2 | 3;
type Variant = 'soft' | 'surface' | 'outline';
type Color = 'accent' | 'neutral';

const sizeToTextSize = { 1: 2, 2: 2, 3: 3 } as const;

export interface CalloutProps
  extends MarginProps, JSX.HTMLAttributes<HTMLDivElement> {
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

/** Short informational message with an optional icon. */
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
  const [local, rest] = splitProps(withoutMargin, [
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
      css.base,
      css.size[local.size],
      css.variantColor[local.variant][local.color][contrast()],
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <Grid as="div" align="start" class={className()} role="note" {...rest}>
      <Flex as="div" align="center" class={css.iconSize[local.size]}>
        {local.icon ?? <IconInformation />}
      </Flex>
      <Text
        as="p"
        size={sizeToTextSize[local.size]}
        trim="both"
        class={css.inheritColor}
      >
        {local.children}
      </Text>
    </Grid>
  );
};

export default Callout;
