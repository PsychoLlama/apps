import type { ArgTypes } from 'storybook-solidjs-vite';
import * as css from './trim.css';

export type LeadingTrim = 'start' | 'end' | 'both';

export interface TrimProps {
  /** Remove extra whitespace above and/or below text caused by line-height. */
  trim?: LeadingTrim;
}

export const trimPropKeys = ['trim'] as const;

export function resolveTrimClass({
  trim,
}: TrimProps): string | false | undefined {
  return trim && css.trim[trim];
}

export const trimArgTypes: ArgTypes<TrimProps> = {
  trim: {
    control: 'inline-radio',
    options: ['start', 'end', 'both'],
  },
};
