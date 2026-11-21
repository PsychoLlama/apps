import { onCleanup, onMount, Show } from 'solid-js';
import { useAction, useValue } from '@lib/effects/solid';
import { Flex, Text } from '@lib/ui';
import IconDrop from 'virtual:icons/mdi/tray-arrow-down';
import { $shareFiles, $shareItem } from '../effects';
import { $dropHovered, $dropping, droppedOf, isShareable } from '../state';
import * as styles from './drop-target.css';

/**
 * Makes the whole page somewhere to drop things into a group: files,
 * links, or text dragged in from anywhere else. While one hovers, the
 * page says so, and letting go shares it.
 *
 * The page, and not a box in it. Nobody aims a drag, and one that lands
 * an inch off a target is a file the browser opens in place of the app.
 *
 * Only for what comes from outside. Something dragged from the feed
 * itself, a link or a picture, would be shared straight back to it.
 */
export const DropTarget = (props: {
  /** The group a drop shares to. */
  groupId: string;
}) => {
  const dropping = useValue($dropping);
  const dropHovered = useAction($dropHovered);
  const shareFiles = useAction($shareFiles);
  const shareItem = useAction($shareItem);

  onMount(() => {
    // How many elements the drag is inside. Entering a child fires before
    // leaving its parent, so a count is what tells a drag that has left
    // the page from one that has moved within it.
    let depth = 0;

    // Whether the drag began on this page.
    let own = false;

    const wanted = (event: DragEvent) =>
      !own && event.dataTransfer !== null && isShareable(event.dataTransfer);

    const settle = () => {
      depth = 0;
      dropHovered(false);
    };

    const onStart = () => {
      own = true;
    };

    const onEnd = () => {
      own = false;
      settle();
    };

    const onEnter = (event: DragEvent) => {
      if (!wanted(event)) return;

      depth += 1;
      dropHovered(true);
    };

    const onLeave = (event: DragEvent) => {
      if (!wanted(event)) return;

      depth = Math.max(0, depth - 1);
      if (depth === 0) dropHovered(false);
    };

    // Without this the browser refuses the drop.
    const onOver = (event: DragEvent) => {
      if (!wanted(event)) return;

      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    };

    const onDrop = (event: DragEvent) => {
      if (!wanted(event) || !event.dataTransfer) return;

      event.preventDefault();
      settle();

      const { files, text } = droppedOf(event.dataTransfer);
      if (files.length > 0) shareFiles(props.groupId, files);
      else if (text !== null) shareItem(props.groupId, text);
    };

    const listeners = [
      ['dragstart', onStart],
      ['dragend', onEnd],
      ['dragenter', onEnter],
      ['dragleave', onLeave],
      ['dragover', onOver],
      ['drop', onDrop],
    ] as const;

    for (const [type, listener] of listeners) {
      document.addEventListener(type, listener);
    }

    onCleanup(() => {
      for (const [type, listener] of listeners) {
        document.removeEventListener(type, listener);
      }

      settle();
    });
  });

  return (
    <Show when={dropping()}>
      <Flex
        as="div"
        direction="column"
        align="center"
        justify="center"
        gap={2}
        class={styles.overlay}
        testId="drop-target"
      >
        <Text as="span" size={8} selectable={false} class={styles.mark}>
          <IconDrop aria-hidden="true" />
        </Text>

        <Text as="p" size={4} weight="medium" selectable={false}>
          Drop to share
        </Text>
      </Flex>
    </Show>
  );
};
