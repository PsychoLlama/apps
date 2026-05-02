import type { ArgTypes } from 'storybook-solidjs-vite';
import * as css from './wrap.css';

export type WrapStrategy = 'wrap' | 'nowrap' | 'pretty' | 'balance';

export interface WrapProps {
  /**
   * Word-wrapping strategy.
   *
   * - `wrap` / `nowrap` — explicit `white-space` toggle.
   * - `pretty` — browser-optimized line breaks; reduces orphans in
   *   body copy.
   * - `balance` — even word distribution across lines; ideal for
   *   headings and short blocks.
   *
   * `pretty` and `balance` only constrain line breaks within a block
   * formatting context, so they're no-ops on inline hosts.
   */
  wrap?: WrapStrategy;
}

export const wrapPropKeys = ['wrap'] as const;

export const resolveWrapClass = ({
  wrap,
}: WrapProps): string | false | undefined => {
  return wrap && css.wrap[wrap];
};

export const wrapArgTypes: ArgTypes<WrapProps> = {
  wrap: {
    control: 'inline-radio',
    options: ['wrap', 'nowrap', 'pretty', 'balance'],
  },
};
