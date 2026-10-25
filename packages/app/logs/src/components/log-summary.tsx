import { For, Show } from 'solid-js';
import { Badge, Code, Flex, Text } from '@lib/ui';
import IconChevronRight from 'virtual:icons/mdi/chevron-right';
import type { ArchivedLog } from '../state';
import { ErrorDetails } from './error-details';
import { contextErrors } from './log-context';
import { levelDisplay } from './level-display';
import * as css from './log-panel.css';

/**
 * An entry's always-visible content, beside its disclosure chevron: a lead
 * line of time, severity, message, and origin, then a callout per error
 * attribute. The chevron shows only when there's a table to open, but
 * always holds its place so every entry's content lines up.
 *
 * The origin rides the lead line's trailing end while it fits, and is the
 * first thing to wrap below when it doesn't. The time shows the clock only;
 * the day lives in the group heading above.
 */
export const LogSummary = (props: {
  log: ArchivedLog;
  expandable: boolean;
}) => {
  const display = () => levelDisplay(props.log.level);
  const time = () => new Date(props.log.timestamp);

  return (
    <>
      <Flex as="div" direction="row" align="center" class={css.disclosureSlot}>
        <IconChevronRight
          aria-hidden="true"
          class={props.expandable ? css.disclosure : css.disclosurePlaceholder}
        />
      </Flex>

      <Flex as="div" direction="column" gap={1} class={css.content}>
        <Flex
          as="div"
          direction="row"
          align="center"
          wrap="wrap"
          class={css.leadLine}
        >
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

        <For each={contextErrors(props.log.context)}>
          {(error) => <ErrorDetails error={error} />}
        </For>
      </Flex>
    </>
  );
};
