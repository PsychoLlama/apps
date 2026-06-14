import * as css from './selectable.css';

/**
 * Controls whether the browser lets the reader select (and copy) the
 * component's text. Decide by what the text *is*, not how it looks:
 *
 * - `true` — content worth copying: user-generated or data-driven text
 *   (chat messages, reviews, prices), generated IDs and inline
 *   identifiers, and instructional copy the reader might quote.
 * - `false` — chrome that belongs to the UI itself: computed labels,
 *   counts, decorative captions, and any text that doubles as a click
 *   target (e.g. a control's own label).
 *
 * Where the prop is optional, omitting it inherits selection from the
 * container — the right default for inline runs nested in a block whose
 * `selectable` already governs the surrounding selection.
 */
export interface SelectableProps {
  /** Allow text selection. See {@link SelectableProps} for the heuristic. */
  selectable?: boolean;
}

/**
 * `SelectableProps` with `selectable` required. Block-level typography
 * and components rendering arbitrary content (e.g. table cells) force
 * the call site to declare whether the text is meant to be copyable —
 * the judgment belongs to the component author, not a global default.
 */
export type RequiredSelectableProps = Required<SelectableProps>;

export const selectablePropKeys = ['selectable'] as const;

/**
 * Resolve the selection class. `undefined` inherits from the container;
 * `true` opts selection in (`user-select: text`), `false` opts it out
 * (`user-select: none`).
 */
export const resolveSelectableClass = ({
  selectable,
}: SelectableProps): string | undefined => {
  if (selectable === undefined) return undefined;
  return selectable ? css.selectable : css.unselectable;
};
