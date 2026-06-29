import { For, Show } from 'solid-js';
import { Badge, Code, Flex, Text } from '@lib/ui';
import type { Log } from '@lib/observability';
import IconChevronRight from 'virtual:icons/mdi/chevron-right';
import { levelDisplay } from './level-display';
import * as css from './log-panel.css';

/**
 * One entry in the day's list, two lines tall. The lead line carries the
 * essentials — time of day, severity, message — with the message taking the
 * remaining width and wrapping. The origin trails on its own line as a
 * breadcrumb, present only when the log carries one, so a log's source reads as
 * a path without crowding the message it belongs to.
 *
 * The time shows the clock only; the day lives in the group heading above.
 */
export const LogEntry = (props: { log: Log }) => {
  const display = () => levelDisplay(props.log.level);
  const time = () => new Date(props.log.timestamp);

  return (
    <Flex as="li" direction="column" gap={1}>
      <Flex as="div" direction="row" align="baseline" gap={3} wrap="wrap">
        <Text
          as="time"
          size={1}
          color="lowContrast"
          selectable
          datetime={time().toISOString()}
          class={css.metaCell}
        >
          {time().toLocaleTimeString()}
        </Text>

        <Badge size={1} variant="soft" color={display().color}>
          {display().label}
        </Badge>

        <Text as="span" size={2} selectable class={css.message}>
          {props.log.message}
        </Text>
      </Flex>

      <Show when={props.log.origin.length > 0}>
        <Flex as="div" direction="row" align="center" gap={1} wrap="wrap">
          <For each={props.log.origin}>
            {(segment, index) => (
              <>
                <Show when={index() > 0}>
                  <IconChevronRight
                    width="14"
                    height="14"
                    aria-hidden="true"
                    class={css.originSeparator}
                  />
                </Show>
                <Code size={1} variant="ghost" color="neutral">
                  {segment}
                </Code>
              </>
            )}
          </For>
        </Flex>
      </Show>
    </Flex>
  );
};
