import { Show } from 'solid-js';
import { Badge, Code, Flex, Text } from '@lib/ui';
import type { Log } from '@lib/observability';
import { levelDisplay } from './level-display';
import * as css from './log-panel.css';

/**
 * One entry in the list: when it happened, how severe it was, where it came
 * from, and what it said. The meta fields (time, level, origin) size to content
 * and hold their line; the message takes the remaining width and wraps,
 * spilling to its own line when the row can't fit it legibly.
 */
export const LogEntry = (props: { log: Log }) => {
  const display = () => levelDisplay(props.log.level);
  const time = () => new Date(props.log.timestamp);

  return (
    <Flex as="li" direction="row" align="baseline" gap={3} wrap="wrap">
      <Text
        as="time"
        size={1}
        color="lowContrast"
        selectable
        datetime={time().toISOString()}
        class={css.metaCell}
      >
        {time().toLocaleString()}
      </Text>

      <Badge size={1} variant="soft" color={display().color}>
        {display().label}
      </Badge>

      <Show when={props.log.origin.length > 0}>
        <Code size={1} variant="ghost" color="neutral" class={css.metaCell}>
          {props.log.origin.join(' › ')}
        </Code>
      </Show>

      <Text as="span" size={2} selectable class={css.message}>
        {props.log.message}
      </Text>
    </Flex>
  );
};
