import { For, Match, Show, Switch, onMount } from 'solid-js';
import { useAnchor, useRun, useValue } from '@lib/state';
import { Badge, Callout, Flex, Text } from '@lib/ui';
import type { PruneRecord } from '@lib/holz-idb-backend/database';
import IconAlert from 'virtual:icons/mdi/alert-outline';
import { LogsView } from '../components/logs-view';
import { LogPanel } from '../components/log-panel';
import { describePrune } from '../components/describe-prune';
import {
  archiveStore,
  logsScope,
  reportSagaFailure,
  trackArchiveSaga,
} from '../state';

/** How many placeholder rows the loading skeleton stands up. */
const SKELETON_ROWS = [0, 1, 2, 3, 4];

/**
 * The log archive at `/logs`. Reads this device's persisted sessions from
 * IndexedDB on mount (client-only — the store is empty at SSG prerender) and
 * renders the matching state: a skeleton while the read is in flight, an
 * empty-state callout when the archive is genuinely empty, an error callout if
 * the read fails, otherwise the {@link LogPanel} — with a {@link PruneNotice}
 * beneath it whenever the archive has been trimmed.
 */
const LogList = () => {
  useAnchor(logsScope);
  const archive = useValue(archiveStore);
  const track = useRun(trackArchiveSaga);

  // IndexedDB and `BroadcastChannel` are client-only — neither exists during
  // SSG — so the tracker starts on mount. It listens for the backend's insert
  // pings, reads the archive through its own connection, then flags the view
  // stale whenever more logs land. The connection is closed by the scope, so
  // there's nothing to release here.
  onMount(() => {
    void track().catch(reportSagaFailure('The log archive tracker failed.'));
  });

  return (
    <LogsView trail={[{ label: 'Logs' }]}>
      <Switch>
        <Match when={archive().status === 'loading'}>
          <LoadingState />
        </Match>
        <Match when={archive().status === 'error'}>
          <ErrorState />
        </Match>
        <Match
          when={archive().status === 'ready' && archive().entries.length === 0}
        >
          <EmptyState />
        </Match>
        <Match when={archive().status === 'ready'}>
          <LogPanel logs={archive().entries} />
        </Match>
      </Switch>

      <Show when={archive().pruned}>
        {(record) => <PruneNotice record={record()} />}
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

/**
 * Dates the archive's newest gap. The list runs newest-first, so the logs a
 * pruning pass dropped would have sat below everything on screen — the notice
 * stands in their place, at the end of the scroll, rather than announcing
 * itself at the top.
 */
const PruneNotice = (props: { record: PruneRecord }) => (
  <Text
    as="p"
    size={1}
    color="lowContrast"
    align="center"
    selectable={false}
    my={5}
  >
    {describePrune(props.record)}
  </Text>
);

/** Shown when the archive read failed outright. */
const ErrorState = () => (
  <Callout color="danger" icon={<IconAlert />}>
    <Text as="span" size={2} selectable={false}>
      Couldn't read the log archive.
    </Text>
  </Callout>
);

export default LogList;
