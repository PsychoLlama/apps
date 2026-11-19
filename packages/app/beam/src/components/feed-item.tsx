import type { Item } from '@crate/beam';
import { Show } from 'solid-js';
import { useAction } from '@lib/effects/solid';
import { Button, Flex, Link, Text, Tooltip } from '@lib/ui';
import IconSync from 'virtual:icons/mdi/cloud-sync-outline';
import { $deleteItem } from '../effects';
import { linkOf } from '../state';
import { FeedFile } from './feed-file';
import * as styles from './feed-item.css';

/**
 * One thing shared to a group: what it is, and what to do with it. Who shared it and when is said once, above the sitting it's part of. Taking it, by copying a note or saving a file,
 * is why it was shared. Deleting removes it for every device in the group.
 *
 * The body is text from another device and is only ever rendered as text.
 * It becomes a link when the whole of it is a web address, and opens in a
 * new tab without handing the page a way back.
 */
export const FeedItem = (props: {
  /** The group the item belongs to. */
  groupId: string;

  /** The item itself. */
  item: Item;

  /** Whether this device wrote it. */
  mine: boolean;
}) => {
  const deleteItem = useAction($deleteItem);

  const copy = () => void navigator.clipboard.writeText(props.item.body);

  return (
    <Flex
      as="article"
      align="start"
      gap={5}
      testId="feed-item"
      class={styles.item}
    >
      <Show
        when={props.item.file}
        fallback={
          <Show
            when={linkOf(props.item.body)}
            fallback={
              <Text as="p" selectable class={styles.body}>
                {props.item.body}
              </Text>
            }
          >
            {(href) => (
              <Text as="p" selectable class={styles.body}>
                <Link
                  testId="feed-item-link"
                  href={href()}
                  native
                  target="_blank"
                  rel="noreferrer"
                  selectable
                >
                  {props.item.body}
                </Link>
              </Text>
            )}
          </Show>
        }
      >
        {(file) => (
          <FeedFile
            groupId={props.groupId}
            itemId={props.item.id}
            file={file()}
          />
        )}
      </Show>

      <Text as="span" selectable={false} class={styles.actions}>
        {/* A file is saved from its own tile. */}
        <Show when={!props.item.file}>
          <Button
            testId="feed-item-copy"
            variant="ghost"
            color="neutral"
            size={1}
            onClick={copy}
          >
            Copy
          </Button>
        </Show>

        <Button
          testId="feed-item-delete"
          aria-label="Delete for everyone"
          variant="ghost"
          color="danger"
          size={1}
          onClick={() => deleteItem(props.groupId, props.item.id)}
        >
          Delete
        </Button>
      </Text>

      {/* Written here, and not yet agreed by the group: its other devices
          haven't all been reachable since. Only said of this device's
          own. On any other device it has plainly arrived. */}
      <Show when={props.mine && !props.item.committed}>
        <Tooltip
          testId="feed-item-pending-tooltip"
          display="inline"
          side="right"
          content="Waiting for the group's other devices"
        >
          {(trigger) => (
            <Text
              {...trigger}
              as="span"
              role="img"
              tabIndex={0}
              color="lowContrast"
              selectable={false}
              aria-label="Waiting for the group's other devices"
              testId="feed-item-pending"
            >
              <IconSync width="16" height="16" aria-hidden="true" />
            </Text>
          )}
        </Tooltip>
      </Show>
    </Flex>
  );
};
