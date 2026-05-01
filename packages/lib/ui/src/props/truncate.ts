import type { ArgTypes } from 'storybook-solidjs-vite';
import * as css from './truncate.css';

export interface TruncateProps {
  /**
   * Truncate overflowing text to a single line with a trailing ellipsis.
   * Requires a constrained width on the element or an ancestor.
   */
  truncate?: boolean;
}

export const truncatePropKeys = ['truncate'] as const;

export const resolveTruncateClass = ({
  truncate,
}: TruncateProps): string | false | undefined => {
  return truncate && css.truncate;
};

export const truncateArgTypes: ArgTypes<TruncateProps> = {
  truncate: {
    control: 'boolean',
  },
};
