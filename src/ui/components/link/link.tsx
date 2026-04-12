/**
 * Link component.
 *
 * Ported from Radix UI Themes Link. Always renders `<A>` from
 * `@solidjs/router` for client-side routing. Only supports accent and
 * neutral colors.
 *
 * @see https://www.radix-ui.com/themes/docs/components/link
 */

import { A, type AnchorProps } from '@solidjs/router';
import { mergeProps, splitProps } from 'solid-js';
import type { ParentComponent } from 'solid-js';
import type { FontWeight, TypeScale } from '#design';
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
import * as css from './link.css';

type LinkColor = 'accent' | 'neutral';
type Underline = 'auto' | 'always' | 'hover' | 'none';

export interface LinkProps extends MarginProps, TrimProps, AnchorProps {
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
  const [local, rest] = splitProps(withoutMargin, [
    'size',
    'weight',
    'underline',
    'color',
    'highContrast',
    'class',
    'children',
    ...trimPropKeys,
  ]);

  const contrast = () => (local.highContrast ? 'high' : 'normal');

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
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <A class={className()} {...rest}>
      {local.children}
    </A>
  );
};

export default Link;
