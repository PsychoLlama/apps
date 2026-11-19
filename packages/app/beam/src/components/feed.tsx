import { createEffect, For, on, Show } from 'solid-js';
import { useValue } from '@lib/effects/solid';
import { Flex, Text } from '@lib/ui';
import { $device, $feed, dayOf, deviceLabel, timeline } from '../state';
import * as styles from './feed.css';
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

  const days = () => timeline(feed().items);

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
      () => ready() && feed().items.at(-1)?.id,
      (newest) => {
        if (newest)
          queueMicrotask(() => list?.scrollIntoView({ block: 'end' }));
      },
    ),
  );

  return (
    <Show when={ready()}>
      <Show
        when={feed().items.length > 0}
        fallback={
          <Text
            as="p"
            selectable={false}
            color="lowContrast"
            testId="feed-empty"
            class={styles.feed}
          >
            Nothing here yet. Share a note, a link, or a file below, and it
            shows up on every device you link.
          </Text>
        }
      >
        <Flex
          as="ol"
          direction="column"
          gap={5}
          testId="feed"
          class={styles.feed}
          ref={(element: HTMLElement) => {
            list = element;
          }}
        >
          <For each={days()}>
            {(day) => (
              <Flex as="li" direction="column" gap={4}>
                <Text
                  as="span"
                  size={1}
                  color="lowContrast"
                  selectable={false}
                  class={styles.day}
                  testId="feed-day"
                >
                  <time datetime={new Date(day.day).toISOString()}>
                    {formatDay(day.day)}
                  </time>
                </Text>

                <Flex as="ol" direction="column" gap={4}>
                  <For each={day.runs}>
                    {(run) => (
                      <Flex as="li" direction="column" gap={1}>
                        <Text
                          as="span"
                          size={1}
                          color="lowContrast"
                          selectable={false}
                          testId="feed-run"
                        >
                          {authorOf(run.author)}
                          {' · '}
                          <time
                            datetime={new Date(run.startedAt).toISOString()}
                          >
                            {formatTime(run.startedAt)}
                          </time>
                        </Text>

                        <Flex as="ol" direction="column" gap={1}>
                          <For each={run.items}>
                            {(item) => (
                              <Flex as="li" direction="column">
                                <FeedItem
                                  groupId={props.groupId}
                                  item={item}
                                  mine={item.author === device().id}
                                />
                              </Flex>
                            )}
                          </For>
                        </Flex>
                      </Flex>
                    )}
                  </For>
                </Flex>
              </Flex>
            )}
          </For>
        </Flex>
      </Show>
    </Show>
  );
};
