import { styleVariants } from '@vanilla-extract/css';

/**
 * `grid-template-columns` by total track count. Tracks are content-sized
 * (`auto`) so every cell aligns to the widest instance in its column and dynamic
 * variants stay aligned. The count is dynamic — a header column plus one per
 * axis entry — so it's selected here rather than expressed as a single rule.
 * `@lib/ui`'s `Grid` only offers equal-width `1fr` columns, which would stretch
 * cells; these auto tracks keep each cell at its intrinsic size, top-left.
 */
export const templateColumns = styleVariants(
  { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 },
  (count) => ({ gridTemplateColumns: `repeat(${count}, auto)` }),
);
