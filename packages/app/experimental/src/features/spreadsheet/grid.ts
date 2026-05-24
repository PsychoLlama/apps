/**
 * Grid geometry. Hard-coded to a fixed shape so cell ids are the only
 * coordinate system the rest of the feature speaks.
 */

/** Number of columns rendered, addressable as A, B, C, … */
export const COLUMN_COUNT = 6;
/** Number of rows rendered, addressable as 1, 2, 3, … */
export const ROW_COUNT = 12;

/** Column letters in display order. `A` is column 0. */
export const COLUMNS: ReadonlyArray<string> = Array.from(
  { length: COLUMN_COUNT },
  (_unused, index) => String.fromCharCode(65 + index),
);

/** Row numbers in display order, 1-indexed for user-facing labels. */
export const ROWS: ReadonlyArray<number> = Array.from(
  { length: ROW_COUNT },
  (_unused, index) => index + 1,
);

/** Stable cell identifier (e.g. `A1`, `F12`). */
export type CellId = string;

/** Compose a cell id from column letter and 1-indexed row. */
export const cellId = (column: string, row: number): CellId =>
  `${column}${row}`;
