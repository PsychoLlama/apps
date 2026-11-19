import { For, Show } from 'solid-js';
import { useValue } from '@lib/effects/solid';
import { Flex, Text } from '@lib/ui';
import { $device, $feed, deviceLabel } from '../state';
import { FeedItem } from './feed-item';

/**
 * Everything shared to a group, newest first: the thing just pasted on one
 * device is the thing wanted on the next, so it belongs at the top, under
 * the composer.
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

  const newestFirst = () => feed().items.toReversed();

  /**
   * What to call whoever wrote an item. A device that has since left the
   * group is no longer listed, and has no name here.
   */
  const authorOf = (author: string): string => {
    if (author === device().id) return 'This device';

    const member = feed().members.find((it) => it.id === author);
    return member ? deviceLabel(member) : 'Another device';
  };

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
          >
            Nothing here yet. What you share shows up on every device in this
            group.
          </Text>
        }
      >
        <Flex as="ol" direction="column" gap={2} testId="feed">
          <For each={newestFirst()}>
            {(item) => (
              <Flex as="li" direction="column">
                <FeedItem
                  groupId={props.groupId}
                  item={item}
                  author={authorOf(item.author)}
                />
              </Flex>
            )}
          </For>
        </Flex>
      </Show>
    </Show>
  );
};
