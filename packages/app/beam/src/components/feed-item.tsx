import type { Item } from '@crate/beam';
import { Show } from 'solid-js';
import { useAction, useValue } from '@lib/effects/solid';
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  Flex,
  IconButton,
  Link,
  Text,
  Tooltip,
} from '@lib/ui';
import IconSync from 'virtual:icons/mdi/cloud-sync-outline';
import IconCopy from 'virtual:icons/mdi/content-copy';
import IconDownload from 'virtual:icons/mdi/download';
import IconDelete from 'virtual:icons/mdi/trash-can-outline';
import { $deleteItem, $saveFile } from '../effects';
import { $itemMenu, $itemMenuToggled, linkOf } from '../state';
import { FeedFile } from './feed-file';
import * as styles from './feed-item.css';

/**
 * One thing shared to a group: what it is, and what to do with it. Who
 * shared it and when is said once, above the sitting it's part of.
 *
 * Taking it, by copying a note or saving a file, is why it was shared.
 * Deleting removes it for every device in the group. Both are offered
 * twice: as buttons beside the row, where they can be found, and in the
 * menu a right click or a long press on the row opens.
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
  const itemMenu = useValue($itemMenu);
  const toggleMenu = useAction($itemMenuToggled);
  const deleteItem = useAction($deleteItem);
  const saveFile = useAction($saveFile);

  const copy = () => void navigator.clipboard.writeText(props.item.body);
  const remove = () => deleteItem(props.groupId, props.item.id);

  /** The item's file, once all of it is here: there's nothing to save before. */
  const held = () => {
    const file = props.item.file;
    return file && file.held >= file.size ? file : undefined;
  };

  const save = () => {
    const file = held();
    if (file) saveFile(props.groupId, props.item.id, file);
  };

  return (
    <ContextMenu
      testId="feed-item-menu"
      display="block"
      color="neutral"
      open={itemMenu() === props.item.id}
      onOpenChange={(open) => toggleMenu(props.item.id, open)}
      content={
        <>
          <Show when={!props.item.file}>
            <ContextMenuItem testId="feed-item-menu-copy" onSelect={copy}>
              Copy
            </ContextMenuItem>
          </Show>

          <Show when={props.item.file}>
            <ContextMenuItem
              testId="feed-item-menu-save"
              disabled={!held() || saveFile.pending}
              onSelect={save}
            >
              Save
            </ContextMenuItem>
          </Show>

          <ContextMenuSeparator />

          <ContextMenuItem
            testId="feed-item-menu-delete"
            color="danger"
            onSelect={remove}
          >
            Delete for everyone
          </ContextMenuItem>
        </>
      }
    >
      <Flex
        as="article"
        align="start"
        gap={3}
        testId="feed-item"
        class={styles.item}
      >
        <Flex as="div" align="start" gap={3} class={styles.content}>
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
                    {/* A link keeps the browser's own menu: opening it
                        somewhere else, or copying its address, are things
                        only that menu can do. */}
                    <Link
                      testId="feed-item-link"
                      href={href()}
                      native
                      target="_blank"
                      rel="noreferrer"
                      selectable
                      onContextMenu={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
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

          {/* Written here, and not yet agreed by the group: its other
              devices haven't all been reachable since. Only said of this
              device's own. On any other device it has plainly arrived. */}
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

        <Text as="span" selectable={false} class={styles.actions}>
          <Show when={!props.item.file}>
            <Tooltip
              testId="feed-item-copy-tooltip"
              display="inline"
              content="Copy"
            >
              {(trigger) => (
                <IconButton
                  {...trigger}
                  testId="feed-item-copy"
                  aria-label="Copy"
                  variant="ghost"
                  color="neutral"
                  size={1}
                  onClick={copy}
                >
                  <IconCopy aria-hidden="true" />
                </IconButton>
              )}
            </Tooltip>
          </Show>

          <Show when={held()}>
            <Tooltip
              testId="feed-item-save-tooltip"
              display="inline"
              content="Save"
            >
              {(trigger) => (
                <IconButton
                  {...trigger}
                  testId="feed-item-save"
                  aria-label="Save"
                  variant="ghost"
                  color="neutral"
                  size={1}
                  disabled={saveFile.pending}
                  onClick={save}
                >
                  <IconDownload aria-hidden="true" />
                </IconButton>
              )}
            </Tooltip>
          </Show>

          <Tooltip
            testId="feed-item-delete-tooltip"
            display="inline"
            content="Delete for everyone"
          >
            {(trigger) => (
              <IconButton
                {...trigger}
                testId="feed-item-delete"
                aria-label="Delete for everyone"
                variant="ghost"
                color="danger"
                size={1}
                onClick={remove}
              >
                <IconDelete aria-hidden="true" />
              </IconButton>
            )}
          </Tooltip>
        </Text>
      </Flex>
    </ContextMenu>
  );
};
