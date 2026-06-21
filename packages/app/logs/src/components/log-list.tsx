import { createEffect, createMemo, For, Match, Show, Switch } from 'solid-js';
import { useEffect } from '@lib/state';
import { Badge, Callout, Container, Flex, Heading, Link, Text } from '@lib/ui';
import { LOG_FILE_NAME, type LogFileInfo } from '@lib/holz-opfs-backend';
import { loadLogFilesEffect } from '../bindings';
import { logArchive } from '../store';
import { formatSessionTime, groupSessionsByDay } from '../format';
import { LogsView } from './logs-view';
import * as css from './log-list.css';

/** Route to a single session's page. Names never contain a slash, but encode defensively. */
const logHref = (file: LogFileInfo): string =>
  `/logs/${encodeURIComponent(file.name)}`;

interface LogRowProps {
  file: LogFileInfo;
  /** Badge the row as this device's current session. Wins over `active`. */
  current?: boolean;
  /** Badge the row as a session still streaming in another tab. */
  active?: boolean;
}

const LogRow = (props: LogRowProps) => (
  <Flex as="li" align="center" gap={2}>
    <Link
      href={logHref(props.file)}
      size={3}
      color="neutral"
      selectable
      testId={`log-${props.file.name}`}
    >
      {formatSessionTime(props.file)}
    </Link>
    <Switch>
      <Match when={props.current}>
        <Badge size={1} variant="soft" color="success">
          Current session
        </Badge>
      </Match>
      <Match when={props.active}>
        <Badge size={1} variant="soft" color="neutral">
          Active
        </Badge>
      </Match>
    </Switch>
  </Flex>
);

/**
 * The log archive index at `/logs`: every session log this device has
 * persisted to OPFS, newest first, with the live session pinned to the top and
 * badged. The list is read lazily on mount — OPFS is unreachable during
 * prerender — so it shows a loading state until the read resolves.
 */
export const LogList = () => {
  const loadLogFiles = useEffect(loadLogFilesEffect);

  // Read the archive on mount; the store caches it so re-entry (e.g. backing
  // out of a session page) reuses the resolved list. The same read snapshots
  // which sessions are still active (hold their Web Lock) — a one-shot read for
  // now; reactivity lands in a followup.
  createEffect(() => {
    if (logArchive.status === 'idle') void loadLogFiles();
  });

  // Sessions bucketed into per-day sections, newest day first; the live
  // session falls into today's group and is badged in place.
  const days = createMemo(() => groupSessionsByDay(logArchive.files));

  return (
    <LogsView trail={[{ label: 'Logs' }]}>
      <Container as="div" size={2}>
        <Flex as="div" direction="column" gap={6}>
          <Flex as="header" direction="column" gap={2}>
            <Heading as="h1" size={7} selectable={false}>
              Logs
            </Heading>
            <Text as="p" size={3} color="lowContrast" selectable={false}>
              Session logs are stored locally on your device. They aren't shared
              unless you explicitly allow it.
            </Text>
          </Flex>

          <Switch>
            <Match when={logArchive.status === 'error'}>
              <Callout color="danger">
                <Text as="span" size={2} selectable={false}>
                  Couldn’t read the saved logs.
                </Text>
              </Callout>
            </Match>

            <Match
              when={
                logArchive.status === 'ready' && logArchive.files.length === 0
              }
            >
              <Callout color="neutral">
                <Text as="span" size={2} selectable={false}>
                  No logs saved yet.
                </Text>
              </Callout>
            </Match>

            <Match when={logArchive.files.length > 0}>
              <Flex as="div" direction="column" gap={5}>
                <For each={days()}>
                  {(day) => (
                    <Flex as="section" direction="column" gap={3}>
                      <Show when={day.label}>
                        {(label) => (
                          <Heading as="h2" size={4} weight="medium" selectable>
                            {label()}
                          </Heading>
                        )}
                      </Show>
                      <Flex
                        as="ul"
                        direction="column"
                        gap={2}
                        class={css.list}
                        aria-label={day.label}
                      >
                        <For each={day.files}>
                          {(file) => (
                            <LogRow
                              file={file}
                              current={file.name === LOG_FILE_NAME}
                              active={logArchive.activeFiles.has(file.name)}
                            />
                          )}
                        </For>
                      </Flex>
                    </Flex>
                  )}
                </For>
              </Flex>
            </Match>

            <Match when={true}>
              <Text as="p" size={2} color="lowContrast" selectable={false}>
                Loading…
              </Text>
            </Match>
          </Switch>
        </Flex>
      </Container>
    </LogsView>
  );
};
