import { defineAction } from '@lib/state';
import { spreadsheetStore } from './store';
import type { CellId } from './grid';

/**
 * Replace a cell's raw text. Empty strings drop the entry so the
 * formula engine treats the cell as blank (= 0 in numeric contexts).
 */
export const setCell = defineAction(
  [spreadsheetStore],
  (sheet, payload: { id: CellId; value: string }) => {
    if (payload.value === '') {
      delete sheet.cells[payload.id];
      return;
    }
    sheet.cells[payload.id] = payload.value;
  },
);

/** Move the keyboard/visual selection to a specific cell, or clear it. */
export const selectCell = defineAction(
  [spreadsheetStore],
  (sheet, id: CellId | null) => {
    sheet.selected = id;
    if (id === null) sheet.editing = null;
  },
);

/** Open a cell's textbox for editing. Also selects it. */
export const beginEdit = defineAction(
  [spreadsheetStore],
  (sheet, id: CellId) => {
    sheet.selected = id;
    sheet.editing = id;
  },
);

/** Close the editor without changing the selection. */
export const endEdit = defineAction([spreadsheetStore], (sheet) => {
  sheet.editing = null;
});
