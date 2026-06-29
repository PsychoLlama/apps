import { For } from 'solid-js';
import { Flex } from '@lib/ui';
import type { Log } from '@lib/observability';
import { LogEntry } from './log-entry';

/**
 * The populated viewer: every persisted log as a row, oldest first (the order
 * the timestamp index reads them back in). Full-bleed — no reading-width cap —
 * so wide rows have room to breathe.
 */
export const LogPanel = (props: { logs: readonly Log[] }) => (
  <Flex as="ol" direction="column" gap={2}>
    <For each={props.logs}>{(log) => <LogEntry log={log} />}</For>
  </Flex>
);
