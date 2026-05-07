import type { ArgTypes } from 'storybook-solidjs-vite';
import * as css from './selectable.css';

export interface SelectableProps {
  /** Allow text selection. Overrides the global `user-select: none` default. */
  selectable?: boolean;
}

/**
 * `SelectableProps` with `selectable` required. Components rendering
 * arbitrary user content (e.g. table cells) opt in so call sites must
 * declare whether the content is meant to be copyable.
 */
export type RequiredSelectableProps = Required<SelectableProps>;

export const selectablePropKeys = ['selectable'] as const;

export const resolveSelectableClass = ({
  selectable,
}: SelectableProps): string | false | undefined => {
  return selectable && css.selectable;
};

export const selectableArgTypes: ArgTypes<SelectableProps> = {
  selectable: {
    control: 'boolean',
  },
};
