/**
 * Shared building blocks for the cards family (`RadioCards` and
 * `CheckboxCards`). Owns the props and styles that don't diverge
 * between the two — visual size scale, surface / classic variant set,
 * semantic palette, fixed column count, root grid container, gap and
 * column variants, and the layered classic shadow stack.
 *
 * Each card component still owns its own item / size / variant / color
 * styles because the layout (RadioCards centers content, CheckboxCards
 * reserves space for an inner Checkbox) and the per-color vars
 * (RadioCards drives an indicator outline; CheckboxCards drives only
 * the focus ring) diverge enough that a single combined set would
 * over-couple them.
 */

/** Visual size on a 1–3 scale. */
export type CardsSize = 1 | 2 | 3;

/** Visual treatment. */
export type CardsVariant = 'surface' | 'classic';

/** Semantic color palette for the card focus / indicator cue. */
export type CardsColor =
  | 'accent'
  | 'neutral'
  | 'danger'
  | 'warning'
  | 'success';

/** Fixed column count — overrides the auto-fit default. */
export type CardsColumns = 1 | 2 | 3 | 4 | 5 | 6;
