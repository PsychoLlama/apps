import { createStore, defineStore } from '@lib/state';
import { cellId, COLUMNS, type CellId } from './grid';

/** Raw textual contents of every populated cell. */
export type CellMap = Record<CellId, string>;

/** In-memory sheet state. Cleared on page reload by design. */
export interface SpreadsheetState {
  /**
   * Raw input keyed by cell id. Strings starting with `=` are formulas;
   * everything else is a literal (number-coerced when possible).
   */
  cells: CellMap;
  /** Currently focused cell, or `null` if no cell has focus. */
  selected: CellId | null;
  /** Cell whose textbox is open for editing, or `null` if none. */
  editing: CellId | null;
}

const seed = (): CellMap => {
  const [colA, colB, , , colE, colF] = COLUMNS;
  return {
    [cellId(colA, 1)]: '12',
    [cellId(colA, 2)]: '24',
    [cellId(colA, 3)]: '18',
    [cellId(colA, 4)]: '32',
    [cellId(colA, 5)]: '9',
    [cellId(colA, 6)]: '27',
    [cellId(colA, 7)]: '15',
    [cellId(colA, 8)]: '21',
    [cellId(colB, 1)]: '=A1*2',
    [cellId(colB, 2)]: '=A2*2',
    [cellId(colB, 3)]: '=A3*2',
    [cellId(colB, 4)]: '=A4*2',
    [cellId(colE, 1)]: 'Total',
    [cellId(colF, 1)]: '=SUM(A1:A8)',
    [cellId(colE, 2)]: 'Average',
    [cellId(colF, 2)]: '=AVG(A1:A8)',
    [cellId(colE, 3)]: 'Min',
    [cellId(colF, 3)]: '=MIN(A1:A8)',
    [cellId(colE, 4)]: 'Max',
    [cellId(colF, 4)]: '=MAX(A1:A8)',
  };
};

export const spreadsheetStore = defineStore<SpreadsheetState>(() => ({
  cells: seed(),
  selected: null,
  editing: null,
}));

export const spreadsheet = createStore(spreadsheetStore);
