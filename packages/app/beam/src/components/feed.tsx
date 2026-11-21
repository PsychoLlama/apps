import { createEffect, createMemo, For, on, Show } from 'solid-js';
import { useValue } from '@lib/effects/solid';
import { name as appName } from '../constants';
import { Flex, Text } from '@lib/ui';
import {
  $device,
  $feed,
  isShown,
  dayOf,
  deviceLabel,
  firstPending,
  timeline,
  type FeedRun,
} from '../state';
import * as styles from './feed.css';
import { FeedEmpty } from './feed-empty';
import { FeedItem } from './feed-item';

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
 * What this device wrote and the group hasn't taken yet sits below a
 * line saying so.
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
  //
  // A day's rows are one flat list, keyed by item. A sitting is not a
  // row of its own: what marks one is its first item, and that changes
  // when the item is deleted. A list keyed by sitting rebuilt every item
  // after it, pictures and all.
  const items = createMemo(() => feed().items.filter(isShown));
  const days = createMemo(() => timeline(items()));
  const dayKeys = () => days().map((day) => day.day);
  const byId = createMemo(
    () => new Map(items().map((item) => [item.id, item])),
  );

  /** The ids of everything shared on a day, oldest first. */
  const idsOf = (dayKey: number): string[] =>
    days()
      .find((it) => it.day === dayKey)
      ?.runs.flatMap((run) => run.items.map((it) => it.id)) ?? [];

  /** Each sitting, by the item it starts with. */
  const starts = createMemo(
    () =>
      new Map(
        days().flatMap((day) =>
          day.runs.flatMap((run): [string, FeedRun][] => {
            const first = run.items[0];
            return first ? [[first.id, run]] : [];
          }),
        ),
      ),
  );

  /** The item this device's unsynced writes begin at, if it has any. */
  const pending = createMemo(() => firstPending(items(), device().id));

  /**
   * What to call whoever wrote an item. A device that has since left the
   * group is no longer listed, and has no name here.
   */
  const authorOf = (author: string): string => {
    if (author === device().id) return 'This device';

    const member = feed().members.find((it) => it.id === author);
    return member ? deviceLabel(member) : 'Another device';
  };

  let list: HTMLElement | undefined;

  // Keep the newest in view: on arriving, and whenever there's a new one.
  // After the rows exist, which is a turn later than the data.
  createEffect(
    on(
      () => ready() && items().at(-1)?.id,
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
        class={items().length > 0 ? styles.feed : styles.blank}
        ref={(element: HTMLElement) => {
          list = element;
        }}
      >
        <Show when={items().length > 0} fallback={<FeedEmpty />}>
          <Flex as="ol" direction="column" gap={5} testId="feed">
            <For each={dayKeys()}>
              {(dayKey) => (
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

                  <Flex as="ol" direction="column" gap={1}>
                    <For each={idsOf(dayKey)}>
                      {(id) => (
                        <Show when={byId().get(id)}>
                          {(item) => (
                            <Flex
                              as="li"
                              direction="column"
                              gap={1}
                              class={
                                starts().has(id) || pending() === id
                                  ? styles.apart
                                  : undefined
                              }
                            >
                              {/* Everything from here down was written on
                                  this device and hasn't reached the
                                  group's other devices. Said once, where
                                  it starts, and not on every item. */}
                              <Show when={pending() === id}>
                                <Text
                                  as="span"
                                  size={1}
                                  color="lowContrast"
                                  selectable={false}
                                  class={styles.day}
                                  testId="feed-pending"
                                >
                                  Not synced yet
                                </Text>
                              </Show>

                              <Show when={starts().get(id)}>
                                {(run) => (
                                  <Text
                                    as="span"
                                    size={1}
                                    color="lowContrast"
                                    selectable={false}
                                    testId="feed-run"
                                  >
                                    {/* The app's own items are said to be
                                        from it, whichever device's clock
                                        and key they were written under. */}
                                    {run().system
                                      ? appName
                                      : authorOf(run().author)}
                                    {' · '}
                                    <time
                                      datetime={new Date(
                                        run().startedAt,
                                      ).toISOString()}
                                    >
                                      {formatTime(run().startedAt)}
                                    </time>
                                  </Text>
                                )}
                              </Show>

                              <FeedItem groupId={props.groupId} item={item()} />
                            </Flex>
                          )}
                        </Show>
                      )}
                    </For>
                  </Flex>
                </Flex>
              )}
            </For>
          </Flex>
        </Show>
      </Flex>
    </Show>
  );
};
