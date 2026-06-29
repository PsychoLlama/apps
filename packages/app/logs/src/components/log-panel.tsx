import { For } from 'solid-js';
import { Flex, Heading, Separator } from '@lib/ui';
import type { Log } from '@lib/observability';
import { LogEntry } from './log-entry';
import { groupLogsByDay } from './group-logs-by-day';

/**
 * The populated viewer: every persisted log, newest first (the order the
 * backend's timestamp read hands them back), bucketed under a heading for the
 * day it happened. A plain vertical list — no surface chrome — so it reads as a
 * dense archive rather than a boxed widget. Ordered lists nested two deep:
 * days, then the entries within a day, because each sequence is a chronology.
 */
export const LogPanel = (props: { logs: readonly Log[] }) => (
  <Flex as="ol" direction="column" gap={5}>
    <For each={groupLogsByDay(props.logs)}>
      {(group) => (
        <Flex as="li" direction="column" gap={3}>
          <Heading
            as="h2"
            size={2}
            weight="medium"
            color="highContrast"
            selectable={false}
          >
            {group.heading}
          </Heading>
          <Separator size={4} decorative />
          <Flex as="ol" direction="column" gap={4}>
            <For each={group.logs}>{(log) => <LogEntry log={log} />}</For>
          </Flex>
        </Flex>
      )}
    </For>
  </Flex>
);
