import { For } from 'solid-js';
import { Flex, Heading } from '@lib/ui';
import type { ArchivedLog } from '../state';
import { LogEntry } from './log-entry';
import { groupLogsByDay } from './group-logs-by-day';
import * as css from './log-panel.css';

/**
 * The populated viewer: every persisted log, newest first (the order the
 * backend's timestamp read hands them back), bucketed under a heading for the
 * day it happened. Runs edge to edge, rows ruled off one another, with each
 * day's heading pinned while its logs scroll past. Ordered lists nested two deep:
 * days, then the entries within a day, because each sequence is a chronology.
 */
export const LogPanel = (props: { logs: readonly ArchivedLog[] }) => (
  <Flex as="ol" direction="column" class={css.panel}>
    <For each={groupLogsByDay(props.logs)}>
      {(group) => (
        <Flex as="li" direction="column">
          <Heading
            as="h2"
            size={2}
            weight="medium"
            color="highContrast"
            selectable={false}
            class={css.dayHeading}
          >
            {group.heading}
          </Heading>
          <Flex as="ol" direction="column">
            <For each={group.logs}>{(log) => <LogEntry log={log} />}</For>
          </Flex>
        </Flex>
      )}
    </For>
  </Flex>
);
