import { For, Show } from 'solid-js';
import { Badge, Code, Flex, Text } from '@lib/ui';
import type { Log, LogContext } from '@lib/observability';
import IconChevronRight from 'virtual:icons/mdi/chevron-right';
import { levelDisplay } from './level-display';
import { ErrorDetails } from './error-details';
import * as css from './log-panel.css';

/**
 * One entry in the day's list, up to three lines. The lead line carries the
 * locating context — time of day, severity, and the origin breadcrumb. The
 * second line is the message itself, trailed by an outline `Code` chip per
 * context attribute (everything but `error`, which has its own treatment). The third
 * line, shown only when the log carries an `error`, is a danger callout of its
 * details.
 *
 * The time shows the clock only; the day lives in the group heading above.
 */
export const LogEntry = (props: { log: Log }) => {
  const display = () => levelDisplay(props.log.level);
  const time = () => new Date(props.log.timestamp);

  // The `error` attribute renders as the callout below, not as a chip. Each
  // remaining value is a `LogContext[string]` — the index-signature value type,
  // a JSON primitive or array of them.
  const attributes = (): Array<[string, LogContext[string]]> =>
    Object.entries(props.log.context).filter(([key]) => key !== 'error');

  return (
    <Flex as="li" direction="column" gap={1}>
      <Flex as="div" direction="row" align="center" gap={3} wrap="wrap">
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

      <Flex as="div" direction="row" align="baseline" gap={2} wrap="wrap">
        <Text as="span" size={2} selectable class={css.message}>
          {props.log.message}
        </Text>

        <For each={attributes()}>
          {([key, value]) => (
            <Code size={1} variant="outline" color="neutral">
              {key}={formatValue(value)}
            </Code>
          )}
        </For>
      </Flex>

      <Show when={props.log.context.error}>
        {(error) => <ErrorDetails error={error()} />}
      </Show>
    </Flex>
  );
};

/**
 * Render a context attribute value — a JSON primitive or array of them — as a
 * compact string. Primitives go through `JSON.stringify`, so strings read as
 * quoted literals (`"req_8f3a"`) and are unambiguous against bare numbers,
 * booleans, and `null`.
 */
const formatValue = (value: LogContext[string]): string => {
  if (Array.isArray(value)) return `[${value.map(formatValue).join(', ')}]`;
  if (value === undefined) return 'undefined';
  return JSON.stringify(value);
};
