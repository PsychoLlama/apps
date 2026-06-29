import { For } from 'solid-js';
import {
  TableBody,
  TableColumnHeaderCell,
  TableHeader,
  TableRoot,
  TableRow,
} from '@lib/ui';
import type { Log } from '@lib/observability';
import { LogEntry } from './log-entry';
import * as css from './log-panel.css';

/**
 * The populated viewer: every persisted log as a table row, oldest first (the
 * order the timestamp index reads them back in). A ghost table — no surface
 * chrome — so it reads as a dense archive rather than a boxed widget.
 */
export const LogPanel = (props: { logs: readonly Log[] }) => (
  <TableRoot variant="ghost" size={1} layout="auto" class={css.breakout}>
    <TableHeader>
      <TableRow>
        <TableColumnHeaderCell selectable={false} class={css.leadingGutter}>
          Time
        </TableColumnHeaderCell>
        <TableColumnHeaderCell selectable={false}>Level</TableColumnHeaderCell>
        <TableColumnHeaderCell selectable={false}>Origin</TableColumnHeaderCell>
        <TableColumnHeaderCell
          selectable={false}
          class={`${css.messageCell} ${css.trailingGutter}`}
        >
          Message
        </TableColumnHeaderCell>
      </TableRow>
    </TableHeader>
    <TableBody>
      <For each={props.logs}>{(log) => <LogEntry log={log} />}</For>
    </TableBody>
  </TableRoot>
);
