import { For, Match, Switch, onCleanup, onMount } from 'solid-js';
import { useEffect } from '@lib/state';
import { Badge, Callout, Flex, Text } from '@lib/ui';
import IconAlert from 'virtual:icons/mdi/alert-outline';
import { LogsView } from './logs-view';
import { LogPanel } from './log-panel';
import { logs, loadLogsEffect, releaseLogsEffect } from '../state';

/** How many placeholder rows the loading skeleton stands up. */
const SKELETON_ROWS = [0, 1, 2, 3, 4];

/**
 * The log archive at `/logs`. Reads this device's persisted sessions from
 * IndexedDB on mount (client-only — the store is empty at SSG prerender) and
 * renders the matching state: a skeleton while the read is in flight, an
 * empty-state callout when the archive is genuinely empty, an error callout if
 * the read fails, otherwise the {@link LogPanel}. The read holds its connection
 * open, so closing it falls to `onCleanup`.
 */
export const LogList = () => {
  const loadLogs = useEffect(loadLogsEffect);
  const releaseLogs = useEffect(releaseLogsEffect);
  onMount(() => void loadLogs());
  onCleanup(() => void releaseLogs());

  return (
    <LogsView trail={[{ label: 'Logs' }]}>
      <Switch>
        <Match when={logs.status === 'loading'}>
          <LoadingState />
        </Match>
        <Match when={logs.status === 'error'}>
          <ErrorState />
        </Match>
        <Match when={logs.status === 'ready' && logs.entries.length === 0}>
          <EmptyState />
        </Match>
        <Match when={logs.status === 'ready'}>
          <LogPanel logs={logs.entries} />
        </Match>
      </Switch>
    </LogsView>
  );
};

/** Placeholder rows shown while the archive read is in flight. */
const LoadingState = () => (
  <Flex as="ol" direction="column" gap={2} aria-hidden="true">
    <For each={SKELETON_ROWS}>
      {() => (
        <Flex as="li" direction="row" align="baseline" gap={3}>
          <Text as="span" size={1} selectable={false} skeleton>
            00:00:00
          </Text>
          <Badge size={1} skeleton>
            INFO
          </Badge>
          <Text as="span" size={2} selectable={false} skeleton>
            Reading the log archive…
          </Text>
        </Flex>
      )}
    </For>
  </Flex>
);

/** Shown when the archive read resolved but there's nothing in it. */
const EmptyState = () => (
  <Callout color="neutral">
    <Text as="span" size={2} selectable={false}>
      No logs found.
    </Text>
  </Callout>
);

/** Shown when the archive read failed outright. */
const ErrorState = () => (
  <Callout color="danger" icon={<IconAlert />}>
    <Text as="span" size={2} selectable={false}>
      Couldn't read the log archive.
    </Text>
  </Callout>
);
