import { For } from 'solid-js';
import {
  Code,
  TableBody,
  TableCell,
  TableRoot,
  TableRow,
  TableRowHeaderCell,
} from '@lib/ui';
import type { LogContext } from '@lib/observability';
import { AttributeValue } from './attribute-value';
import { flattenAttributes } from './log-context';
import * as css from './log-panel.css';

/** A log's context as key/value rows, keys dotted down through objects. */
export const AttributeTable = (props: { context: LogContext }) => (
  <TableRoot size={1} variant="ghost" class={css.attributes}>
    <TableBody>
      <For each={flattenAttributes(props.context)}>
        {(entry) => (
          <TableRow align="baseline">
            <TableRowHeaderCell selectable class={css.attributeKey}>
              <Code size={1} variant="ghost" color="neutral">
                {entry.key}
              </Code>
            </TableRowHeaderCell>
            <TableCell selectable>
              <AttributeValue value={entry.value} />
            </TableCell>
          </TableRow>
        )}
      </For>
    </TableBody>
  </TableRoot>
);
