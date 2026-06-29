import { Show } from 'solid-js';
import {
  Badge,
  Code,
  Text,
  TableCell,
  TableRow,
  TableRowHeaderCell,
} from '@lib/ui';
import type { Log } from '@lib/observability';
import { levelDisplay } from './level-display';
import * as css from './log-panel.css';

/**
 * One row in the table: when it happened, how severe it was, where it came
 * from, and what it said. The meta columns (time, level, origin) size to
 * content and hold their line; the message column takes the remaining width
 * and wraps.
 */
export const LogEntry = (props: { log: Log }) => {
  const display = () => levelDisplay(props.log.level);
  const time = () => new Date(props.log.timestamp);

  return (
    <TableRow align="baseline">
      <TableRowHeaderCell selectable class={css.metaCell}>
        <Text
          as="time"
          size={1}
          color="lowContrast"
          selectable
          datetime={time().toISOString()}
        >
          {time().toLocaleString()}
        </Text>
      </TableRowHeaderCell>

      <TableCell selectable={false} class={css.metaCell}>
        <Badge size={1} variant="soft" color={display().color}>
          {display().label}
        </Badge>
      </TableCell>

      <TableCell selectable class={css.metaCell}>
        <Show when={props.log.origin.length > 0}>
          <Code size={1} variant="ghost" color="neutral">
            {props.log.origin.join(' › ')}
          </Code>
        </Show>
      </TableCell>

      <TableCell selectable>
        <Text as="span" size={2} selectable>
          {props.log.message}
        </Text>
      </TableCell>
    </TableRow>
  );
};
