import { createEffect, For, onCleanup, onMount, Show } from 'solid-js';
import type { JSX } from 'solid-js';
import { Flex, Heading, Text } from '@lib/ui';
import { useAction } from '@lib/state';
import { SiteHeader } from '@lib/shell';
import { BarChart, type BarChartDatum } from './BarChart';
import { beginEdit, endEdit, selectCell, setCell } from './actions';
import {
  evaluateCell,
  formatCellValue,
  numericValue,
  type CellValue,
} from './formula';
import { cellId, COLUMN_COUNT, COLUMNS, ROWS } from './grid';
import type { CellId } from './grid';
import { spreadsheet } from './store';
import * as css from './spreadsheet.css';

const valueClass = (value: CellValue): string => {
  if (value.kind === 'error') return `${css.cellValue} ${css.cellError}`;
  if (value.kind === 'number') return `${css.cellValue} ${css.cellNumeric}`;
  return css.cellValue;
};

interface CellProps {
  id: CellId;
  value: CellValue;
  raw: string;
  selected: boolean;
  editing: boolean;
  /**
   * When `editing` opens the editor, controls how the input seeds its
   * selection. `true` selects existing content (typing replaces);
   * `false` parks the caret at the end (used by type-to-edit so the
   * seeded character isn't immediately overwritten).
   */
  selectOnEdit: boolean;
  onSelect: (id: CellId) => void;
  onBeginEdit: (id: CellId) => void;
  onCommit: (id: CellId, value: string) => void;
  onCancel: () => void;
}

const Cell = (props: CellProps) => {
  let inputElement: HTMLInputElement | undefined;

  createEffect(() => {
    if (props.editing && inputElement) {
      inputElement.focus();
      if (props.selectOnEdit) {
        inputElement.select();
      } else {
        const end = inputElement.value.length;
        inputElement.setSelectionRange(end, end);
      }
    }
  });

  const commit = () => {
    if (!inputElement) return;
    props.onCommit(props.id, inputElement.value);
  };

  return (
    <Flex
      as="div"
      align="center"
      class={`${css.cell} ${props.selected ? css.cellSelected : ''}`}
      data-testid={`cell-${props.id}`}
      onClick={() => props.onSelect(props.id)}
      onDblClick={() => props.onBeginEdit(props.id)}
    >
      <Show
        when={!props.editing}
        fallback={
          <input
            ref={(element: HTMLInputElement) => {
              inputElement = element;
            }}
            class={css.cellInput}
            value={props.raw}
            data-testid={`cell-input-${props.id}`}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commit();
              } else if (event.key === 'Escape') {
                event.preventDefault();
                props.onCancel();
              }
            }}
            onBlur={commit}
          />
        }
      >
        <Text as="span" class={valueClass(props.value)} selectable={false}>
          {formatCellValue(props.value)}
        </Text>
      </Show>
    </Flex>
  );
};

const Inspector = (props: {
  selected: CellId | null;
  raw: string;
  value: CellValue;
  onChange: (id: CellId, value: string) => void;
}) => {
  let formulaElement: HTMLInputElement | undefined;

  // Sync the input when the user picks a different cell.
  createEffect(() => {
    if (!formulaElement) return;
    const next = props.selected ? props.raw : '';
    if (formulaElement.value !== next) formulaElement.value = next;
  });

  const commit = () => {
    if (!formulaElement || !props.selected) return;
    props.onChange(props.selected, formulaElement.value);
  };

  return (
    <Flex as="section" direction="column" gap={2}>
      <Flex as="div" align="baseline" justify="between" gap={3}>
        <Text
          as="span"
          size={1}
          weight="medium"
          class={css.cellTag}
          selectable={false}
        >
          {props.selected ?? '—'}
        </Text>
        <Show when={props.selected}>
          <Text as="span" size={1} class={css.hint} selectable>
            ={formatCellValue(props.value) || '∅'}
          </Text>
        </Show>
      </Flex>
      <input
        ref={(element: HTMLInputElement) => {
          formulaElement = element;
        }}
        class={css.formulaInput}
        placeholder="Select a cell, then type a value or =formula"
        data-testid="formula-input"
        disabled={!props.selected}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
      />
      <Text as="span" size={1} class={css.hint} selectable={false}>
        Formulas start with `=`. Supports A1 refs, ranges (A1:A8), and
        SUM/AVG/MIN/MAX/COUNT.
      </Text>
    </Flex>
  );
};

export const Spreadsheet = () => {
  const updateCell = useAction(setCell);
  const pickCell = useAction(selectCell);
  const openEditor = useAction(beginEdit);
  const closeEditor = useAction(endEdit);

  const handleKeydown = (event: KeyboardEvent) => {
    const id = spreadsheet.selected;
    if (!id) return;
    if (spreadsheet.editing) return;
    // Don't hijack keys while the user is typing in any other input —
    // notably the formula inspector.
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      return;
    }
    if (event.key === 'Enter' || event.key === 'F2') {
      event.preventDefault();
      openEditor({ id });
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      updateCell({ id, value: '' });
      return;
    }
    if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      // Start typing — clear the cell and open the editor with the
      // pressed key as the initial character. `selectOnOpen: false`
      // parks the caret after the seeded char so the next key
      // appends instead of replacing.
      event.preventDefault();
      updateCell({ id, value: event.key });
      openEditor({ id, selectOnOpen: false });
    }
  };

  // Wire the global keydown handler client-side only — the component is
  // pre-rendered server-side where `window` doesn't exist.
  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    onCleanup(() => window.removeEventListener('keydown', handleKeydown));
  });

  const chartData = (): BarChartDatum[] => {
    const [colA] = COLUMNS;
    return ROWS.map((row) => {
      const id = cellId(colA, row);
      return {
        label: id,
        value: numericValue(evaluateCell(spreadsheet.cells, id)),
      };
    });
  };

  const selectedValue = (): CellValue =>
    spreadsheet.selected
      ? evaluateCell(spreadsheet.cells, spreadsheet.selected)
      : { kind: 'empty' };

  // Inline because the CSS Grid relies on element ordering, and CSS
  // custom properties live cleanest in a plain `style` object.
  const gridStyle: JSX.CSSProperties = { '--col-count': COLUMN_COUNT };

  return (
    <Flex as="main" direction="column" class={css.shell}>
      <SiteHeader title="Spreadsheet" />
      <Flex as="div" direction="column" class={css.body}>
        <Flex as="header" direction="column" gap={1}>
          <Heading as="h1" size={5} weight="medium">
            Mini spreadsheet
          </Heading>
          <Text as="p" size={2} color="lowContrast">
            Click a cell to select. Press Enter or double-click to edit. Column
            A drives the chart below.
          </Text>
        </Flex>

        <Inspector
          selected={spreadsheet.selected}
          raw={
            spreadsheet.selected
              ? (spreadsheet.cells[spreadsheet.selected] ?? '')
              : ''
          }
          value={selectedValue()}
          onChange={(id, value) => updateCell({ id, value })}
        />

        <Flex as="section" direction="column" class={css.sheetCard}>
          <Flex as="div" class={css.sheetScroll}>
            <Flex as="div" class={css.sheetGrid} style={gridStyle}>
              <Flex as="div" class={css.headerCell} aria-hidden="true" />
              <For each={COLUMNS}>
                {(column) => (
                  <Flex
                    as="div"
                    align="center"
                    justify="center"
                    class={css.headerCell}
                  >
                    {column}
                  </Flex>
                )}
              </For>
              <For each={ROWS}>
                {(row) => (
                  <>
                    <Flex
                      as="div"
                      align="center"
                      justify="center"
                      class={css.headerCell}
                    >
                      {row}
                    </Flex>
                    <For each={COLUMNS}>
                      {(column) => {
                        const id = cellId(column, row);
                        return (
                          <Cell
                            id={id}
                            raw={spreadsheet.cells[id] ?? ''}
                            value={evaluateCell(spreadsheet.cells, id)}
                            selected={spreadsheet.selected === id}
                            editing={spreadsheet.editing?.id === id}
                            selectOnEdit={
                              spreadsheet.editing?.selectOnOpen ?? true
                            }
                            onSelect={pickCell}
                            onBeginEdit={(target) => openEditor({ id: target })}
                            onCommit={(target, value) => {
                              updateCell({ id: target, value });
                              closeEditor();
                            }}
                            onCancel={closeEditor}
                          />
                        );
                      }}
                    </For>
                  </>
                )}
              </For>
            </Flex>
          </Flex>
        </Flex>

        <Flex as="section" direction="column" gap={2}>
          <Heading as="h2" size={3} weight="medium">
            Column A
          </Heading>
          <BarChart
            data={chartData()}
            emptyMessage="Add numbers to column A to render bars"
          />
        </Flex>
      </Flex>
    </Flex>
  );
};
