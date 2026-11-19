import { createEffect, createMemo, For, on, Show } from 'solid-js';
import { useValue } from '@lib/effects/solid';
import { Flex, Text } from '@lib/ui';
import {
  $device,
  $feed,
  dayOf,
  deviceLabel,
  timeline,
  type FeedDay,
  type FeedRun,
} from '../state';
import * as styles from './feed.css';
import { FeedItem } from './feed-item';
import { LinkPrompt } from './link-prompt';

const DAY = 24 * 60 * 60 * 1000;

/** A day, the way it's said: today, yesterday, or its date. */
const formatDay = (day: number): string => {
  const today = dayOf(Date.now());
  if (day === today) return 'Today';
  if (day === dayOf(today - DAY / 2)) return 'Yesterday';

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year:
      new Date(day).getFullYear() === new Date().getFullYear()
        ? undefined
        : 'numeric',
  }).format(day);
};

/** What tells one sitting from another: the first thing shared in it. */
const keyOf = (run: FeedRun): string => run.items[0]?.id ?? '';

const runKeys = (day: FeedDay | undefined): string[] =>
  day?.runs.map(keyOf) ?? [];

/** A time of day, in the reader's locale. */
const formatTime = (epochMilliseconds: number): string =>
  new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(
    epochMilliseconds,
  );

/**
 * Everything shared to a group, read like a chat: oldest at the top,
 * newest at the bottom on the composer, and scrolled to the bottom when
 * something new arrives.
 *
 * Grouped by day, and within a day by sitting: what one device shared
 * without a long pause sits under one line saying who and when.
 *
 * While this device is alone in the group, the feed ends with a prompt
 * to link another.
 *
 * Renders nothing until the database has answered for this group. An empty
 * feed before then would read as "nothing has been shared".
 */
export const Feed = (props: {
  /** The group to show. */
  groupId: string;
}) => {
  const feed = useValue($feed);
  const device = useValue($device);

  /** Whether the feed holds this group's items, and not the last one's. */
  const ready = () => feed().loaded && feed().groupId === props.groupId;

  // The database hands over a whole new list on every change, and rows
  // drawn from it directly would all be torn down and built again each
  // time: a picture reloading whenever anything was shared. So the lists
  // are of keys, which compare equal from one read to the next, and each
  // row looks up what it shows.
  const days = createMemo(() => timeline(feed().items));
  const dayKeys = () => days().map((day) => day.day);
  const byId = createMemo(
    () => new Map(feed().items.map((item) => [item.id, item])),
  );

  /**
   * What to call whoever wrote an item. A device that has since left the
   * group is no longer listed, and has no name here.
   */
  const authorOf = (author: string): string => {
    if (author === device().id) return 'This device';

    const member = feed().members.find((it) => it.id === author);
    return member ? deviceLabel(member) : 'Another device';
  };

  /**
   * Whether this device is the only one in the group. The list always
   * has this device in it, so one is an answer and none is not yet.
   */
  const alone = () => feed().members.length === 1;

  let list: HTMLElement | undefined;

  // Keep the newest in view: on arriving, and whenever there's a new one.
  // After the rows exist, which is a turn later than the data.
  createEffect(
    on(
      () => ready() && feed().items.at(-1)?.id,
      (newest) => {
        if (newest)
          queueMicrotask(() => list?.scrollIntoView({ block: 'end' }));
      },
    ),
  );

  return (
    <Show when={ready()}>
      <Flex
        as="div"
        direction="column"
        gap={5}
        class={styles.feed}
        ref={(element: HTMLElement) => {
          list = element;
        }}
      >
        <Show when={feed().items.length > 0}>
          <Flex as="ol" direction="column" gap={5} testId="feed">
            <For each={dayKeys()}>
              {(dayKey) => {
                const day = () => days().find((it) => it.day === dayKey);

                return (
                  <Flex as="li" direction="column" gap={4}>
                    <Text
                      as="span"
                      size={1}
                      color="lowContrast"
                      selectable={false}
                      class={styles.day}
                      testId="feed-day"
                    >
                      <time datetime={new Date(dayKey).toISOString()}>
                        {formatDay(dayKey)}
                      </time>
                    </Text>

                    <Flex as="ol" direction="column" gap={4}>
                      <For each={runKeys(day())}>
                        {(runKey) => {
                          const run = () =>
                            day()?.runs.find((it) => keyOf(it) === runKey);

                          return (
                            <Flex as="li" direction="column" gap={1}>
                              <Text
                                as="span"
                                size={1}
                                color="lowContrast"
                                selectable={false}
                                testId="feed-run"
                              >
                                {authorOf(run()?.author ?? '')}
                                {' · '}
                                <time
                                  datetime={new Date(
                                    run()?.startedAt ?? 0,
                                  ).toISOString()}
                                >
                                  {formatTime(run()?.startedAt ?? 0)}
                                </time>
                              </Text>

                              <Flex as="ol" direction="column" gap={1}>
                                <For each={run()?.items.map((it) => it.id)}>
                                  {(id) => (
                                    <Show when={byId().get(id)}>
                                      {(item) => (
                                        <Flex as="li" direction="column">
                                          <FeedItem
                                            groupId={props.groupId}
                                            item={item()}
                                            mine={item().author === device().id}
                                          />
                                        </Flex>
                                      )}
                                    </Show>
                                  )}
                                </For>
                              </Flex>
                            </Flex>
                          );
                        }}
                      </For>
                    </Flex>
                  </Flex>
                );
              }}
            </For>
          </Flex>
        </Show>

        <Show
          when={alone()}
          fallback={
            <Show when={feed().items.length === 0}>
              <Text
                as="p"
                selectable={false}
                color="lowContrast"
                testId="feed-empty"
              >
                Nothing here yet.
              </Text>
            </Show>
          }
        >
          <LinkPrompt groupId={props.groupId} />
        </Show>
      </Flex>
    </Show>
  );
};
