import { For } from 'solid-js';
import { Flex } from '@lib/ui';
import type { Log } from '@lib/observability';
import { LogEntry } from './log-entry';

/**
 * The populated viewer: every persisted log as a list item, newest first (the
 * order the backend's timestamp read hands them back). A plain vertical list —
 * no surface chrome — so it reads as a dense archive rather than a boxed
 * widget. Ordered, because the sequence is the chronology.
 */
export const LogPanel = (props: { logs: readonly Log[] }) => (
  <Flex as="ol" direction="column" gap={2}>
    <For each={props.logs}>{(log) => <LogEntry log={log} />}</For>
  </Flex>
);
