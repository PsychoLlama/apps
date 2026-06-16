import { createEffect, createMemo, For, Match, Show, Switch } from 'solid-js';
import { useEffect } from '@lib/state';
import {
  Badge,
  Callout,
  Card,
  Code,
  Container,
  Flex,
  Heading,
  Text,
} from '@lib/ui';
import { LOG_FILE_NAME, type LogFileInfo } from '@lib/observability';
import IconChevronRight from 'virtual:icons/mdi/chevron-right';
import { loadLogFilesEffect } from '../bindings';
import { logArchive } from '../store';
import { formatBytes, formatSessionTime } from '../format';
import { LogsView } from './logs-view';
import * as css from './log-list.css';

/** Route to a single session's page. Names never contain a slash, but encode defensively. */
const logHref = (file: LogFileInfo): string =>
  `/logs/${encodeURIComponent(file.name)}`;

interface LogCardProps {
  file: LogFileInfo;
  /** Badge the card as this device's live session. */
  current?: boolean;
}

const LogCard = (props: LogCardProps) => (
  <Flex as="li" class={css.item}>
    <Card
      as="a"
      href={logHref(props.file)}
      size={3}
      variant="surface"
      class={css.card}
      testId={`log-${props.file.name}`}
    >
      <Flex as="div" align="center" gap={4}>
        <Flex as="div" direction="column" gap={1} grow>
          <Flex as="div" align="center" gap={2}>
            <Heading as="h2" size={3} weight="medium" selectable={false}>
              {formatSessionTime(props.file)}
            </Heading>
            <Show when={props.current}>
              <Badge size={1} variant="soft" color="success">
                Current
              </Badge>
            </Show>
          </Flex>
          <Code size={1} color="neutral" truncate>
            {props.file.name}
          </Code>
        </Flex>
        <Text as="span" size={1} color="lowContrast" selectable={false}>
          {formatBytes(props.file.size)}
        </Text>
        <IconChevronRight
          width="20"
          height="20"
          class={css.chevron}
          aria-hidden="true"
        />
      </Flex>
    </Card>
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
  // out of a session page) reuses the resolved list.
  createEffect(() => {
    if (logArchive.status === 'idle') void loadLogFiles();
  });

  const current = createMemo<LogFileInfo | undefined>(() =>
    logArchive.files.find((file) => file.name === LOG_FILE_NAME),
  );

  // Everything but the live session, which renders on its own above the rest.
  const earlier = createMemo<ReadonlyArray<LogFileInfo>>(() =>
    logArchive.files.filter((file) => file.name !== LOG_FILE_NAME),
  );

  return (
    <LogsView trail={[{ label: 'Logs' }]}>
      <Container as="div" size={2}>
        <Flex as="div" direction="column" gap={6}>
          <Flex as="header" direction="column" gap={2}>
            <Heading as="h1" size={7} selectable={false}>
              Logs
            </Heading>
            <Text as="p" size={3} color="lowContrast" selectable={false}>
              Session logs this device has saved on disk. Pick one to inspect
              it.
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
                <Show when={current()}>
                  {(file) => (
                    <Flex
                      as="ul"
                      direction="column"
                      gap={3}
                      class={css.list}
                      aria-label="Current session"
                    >
                      <LogCard file={file()} current />
                    </Flex>
                  )}
                </Show>

                <Show when={earlier().length > 0}>
                  <Flex as="section" direction="column" gap={3}>
                    <Heading
                      as="h2"
                      size={2}
                      weight="medium"
                      color="lowContrast"
                      selectable={false}
                    >
                      Earlier sessions
                    </Heading>
                    <Flex
                      as="ul"
                      direction="column"
                      gap={3}
                      class={css.list}
                      aria-label="Earlier sessions"
                    >
                      <For each={earlier()}>
                        {(file) => <LogCard file={file} />}
                      </For>
                    </Flex>
                  </Flex>
                </Show>
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
