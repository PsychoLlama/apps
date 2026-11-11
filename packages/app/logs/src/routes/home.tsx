import { For, Match, Show, Switch } from 'solid-js';
import { useClientValue } from '@lib/effects/solid';
import { Badge, Callout, Flex, Text } from '@lib/ui';
import { LogsView } from '../components/logs-view';
import { LogPanel } from '../components/log-panel';
import { $archivedLogs } from '../effects';

/** How many placeholder rows the loading skeleton stands up. */
const SKELETON_ROWS = [0, 1, 2, 3, 4];

/**
 * The log archive at `/logs`. Reads this device's persisted sessions from
 * IndexedDB on mount (client-only — the store is empty at SSG prerender) and
 * renders the matching state: a skeleton while the read is in flight, an
 * empty-state callout when the archive is genuinely empty, otherwise the
 * {@link LogPanel}. A failed read reaches the error boundary.
 */
const LogList = () => {
  const logs = useClientValue($archivedLogs);

  return (
    <LogsView trail={[{ label: 'Logs' }]}>
      <Show when={logs.ready} fallback={<LoadingState />}>
        <Switch>
          <Match when={logs()?.length === 0}>
            <EmptyState />
          </Match>
          <Match when={logs()}>
            {(loaded) => <LogPanel logs={loaded()} />}
          </Match>
        </Switch>
      </Show>
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

export default LogList;
