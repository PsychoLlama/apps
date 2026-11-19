import type { Item } from '@crate/beam';
import { Show } from 'solid-js';
import { useAction } from '@lib/effects/solid';
import { Card, Flex, IconButton, Link, Text } from '@lib/ui';
import IconSync from 'virtual:icons/mdi/cloud-sync-outline';
import IconContentCopy from 'virtual:icons/mdi/content-copy';
import IconDelete from 'virtual:icons/mdi/delete-outline';
import IconDownload from 'virtual:icons/mdi/download';
import { $deleteItem, $saveFile } from '../effects';
import { linkOf } from '../state';
import { FeedFile } from './feed-file';
import * as styles from './feed-item.css';

/** When something was shared, in the reader's locale. */
const formatTime = (epochMilliseconds: number): string =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(epochMilliseconds);

/**
 * One thing shared to a group: what it is, who shared it and when, and the
 * two things to do with it. Taking it, by copying a note or saving a file,
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

  /** What to call the device that wrote it. */
  author: string;
}) => {
  const deleteItem = useAction($deleteItem);
  const saveFile = useAction($saveFile);

  const copy = () => void navigator.clipboard.writeText(props.item.body);

  return (
    <Card as="article" size={2} testId="feed-item">
      <Flex as="div" direction="column" gap={2}>
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
          {(file) => <FeedFile file={file()} />}
        </Show>

        <Flex as="footer" align="center" justify="between" gap={2}>
          <Text as="span" size={1} color="lowContrast" selectable={false}>
            {props.author}
            {' · '}
            <time datetime={new Date(props.item.createdAt).toISOString()}>
              {formatTime(props.item.createdAt)}
            </time>
          </Text>

          {/* Shared, not yet agreed: the group's other devices haven't
              all been reachable since it was written. It still shows
              everywhere it has reached. */}
          <Show when={!props.item.committed}>
            <Flex
              as="div"
              align="center"
              gap={1}
              grow
              testId="feed-item-pending"
            >
              <IconSync width="14" height="14" aria-hidden="true" />
              <Text as="span" size={1} color="lowContrast" selectable={false}>
                Waiting to sync
              </Text>
            </Flex>
          </Show>

          <Flex as="div" gap={1}>
            <Show
              when={props.item.file}
              fallback={
                <IconButton
                  testId="feed-item-copy"
                  aria-label="Copy"
                  variant="ghost"
                  color="neutral"
                  size={1}
                  onClick={copy}
                >
                  <IconContentCopy aria-hidden="true" />
                </IconButton>
              }
            >
              {(file) => (
                <IconButton
                  testId="feed-item-save"
                  aria-label="Save"
                  variant="ghost"
                  color="neutral"
                  size={1}
                  // Nothing to save until all of it is here.
                  disabled={file().held < file().size || saveFile.pending}
                  onClick={() => saveFile(props.groupId, props.item.id, file())}
                >
                  <IconDownload aria-hidden="true" />
                </IconButton>
              )}
            </Show>

            <IconButton
              testId="feed-item-delete"
              aria-label="Delete for everyone"
              variant="ghost"
              color="danger"
              size={1}
              onClick={() => deleteItem(props.groupId, props.item.id)}
            >
              <IconDelete aria-hidden="true" />
            </IconButton>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
};
