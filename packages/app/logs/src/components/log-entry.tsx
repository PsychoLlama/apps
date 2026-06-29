import { Show } from 'solid-js';
import { Badge, Code, Flex, Text } from '@lib/ui';
import type { Log } from '@lib/observability';
import { levelDisplay } from './level-display';

/**
 * One row in the viewer: when it happened, how severe it was, where it came
 * from, and what it said. The meta (time, level, origin) leads; the message
 * trails and wraps, so long lines reflow under the row rather than push it
 * wide.
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
      >
        {time().toLocaleString()}
      </Text>

      <Badge size={1} variant="soft" color={display().color}>
        {display().label}
      </Badge>

      <Show when={props.log.origin.length > 0}>
        <Code size={1} variant="ghost" color="neutral">
          {props.log.origin.join(' › ')}
        </Code>
      </Show>

      <Text as="span" size={2} selectable>
        {props.log.message}
      </Text>
    </Flex>
  );
};
