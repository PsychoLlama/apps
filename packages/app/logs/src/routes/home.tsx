import { For, Match, Show, Switch } from 'solid-js';
import { useClientValue } from '@lib/effects/solid';
import { Badge, Callout, Flex, Text } from '@lib/ui';
import type { PruneRecord } from '@lib/holz-idb-backend/database';
import { LogsView } from '../components/logs-view';
import { LogPanel } from '../components/log-panel';
import { describePrune } from '../components/describe-prune';
import { $trackedArchive } from '../effects';

/** How many placeholder rows the loading skeleton stands up. */
const SKELETON_ROWS = [0, 1, 2, 3, 4];

/**
 * The log archive at `/logs`. Reads this device's persisted sessions from
 * IndexedDB on mount (client-only — the store is empty at SSG prerender) and
 * renders the matching state: a skeleton while the read is in flight, an
 * empty-state callout when the archive is genuinely empty, otherwise the
 * {@link LogPanel} — with a {@link PruneNotice} beneath it whenever the archive
 * has been trimmed. A failed read reaches the error boundary.
 */
const LogList = () => {
  const archive = useClientValue($trackedArchive);

  return (
    <LogsView trail={[{ label: 'Logs' }]}>
      <Show when={archive.ready} fallback={<LoadingState />}>
        <Switch>
          <Match when={archive()?.entries.length === 0}>
            <EmptyState />
          </Match>
          <Match when={archive()}>
            {(loaded) => <LogPanel logs={loaded().entries} />}
          </Match>
        </Switch>

        <Show when={archive()?.pruned}>
          {(record) => <PruneNotice record={record()} />}
        </Show>
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

export default LogList;
