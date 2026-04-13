import type { ArgTypes } from 'storybook-solidjs-vite';
import * as css from './selectable.css';

export interface SelectableProps {
  /** Allow text selection. Overrides the global `user-select: none` default. */
  selectable?: boolean;
}

export const selectablePropKeys = ['selectable'] as const;

export function resolveSelectableClass({
  selectable,
}: SelectableProps): string | false | undefined {
  return selectable && css.selectable;
}

export const selectableArgTypes: ArgTypes<SelectableProps> = {
  selectable: {
    control: 'boolean',
  },
};
