import type { SharedFile } from '@crate/beam';
import { createEffect, onCleanup, Show } from 'solid-js';
import { useAction } from '@lib/effects/solid';
import { Flex, IconButton, Progress, Text } from '@lib/ui';
import IconDownload from 'virtual:icons/mdi/download';
import IconFile from 'virtual:icons/mdi/file-outline';
import { $previewFile, $saveFile } from '../effects';
import { formatBytes, isPreviewable } from '../state';
import * as styles from './feed-file.css';

/**
 * A shared file, as a tile of one size: a preview, and under it the
 * file's name and size with a way to save it.
 *
 * While it's arriving the preview is how much has. Once it's all here a
 * picture is shown, anything else says what type it is, and the save
 * button appears: there's nothing to save before then.
 *
 * The name and type are another device's words and are only ever
 * rendered as text.
 */
export const FeedFile = (props: {
  /** The group the file was shared to. */
  groupId: string;

  /** The item that carries it. */
  itemId: string;

  /** The file. */
  file: SharedFile;
}) => {
  const previewFile = useAction($previewFile);
  const saveFile = useAction($saveFile);

  const here = () => props.file.held >= props.file.size;

  // Read the picture back once, when the last of it lands.
  let asked = false;
  createEffect(() => {
    if (asked || !here() || !isPreviewable(props.file)) return;

    asked = true;
    previewFile(props.groupId, props.itemId, props.file);
  });

  onCleanup(() => {
    if (previewFile.latest) URL.revokeObjectURL(previewFile.latest);
  });

  return (
    <Flex as="figure" direction="column" class={styles.tile} testId="feed-file">
      <Show
        when={here()}
        fallback={
          // Arriving from whichever of the group's devices have it.
          // Nothing promises any of them is reachable, so this can sit
          // still.
          <Flex
            as="div"
            direction="column"
            class={`${styles.preview} ${styles.stated}`}
            testId="feed-file-fetching"
          >
            <Progress
              size={1}
              value={props.file.held}
              max={props.file.size}
              aria-label="Fetching"
            />
            <Text as="span" size={1} color="lowContrast" selectable={false}>
              {formatBytes(props.file.held)} of {formatBytes(props.file.size)}
            </Text>
          </Flex>
        }
      >
        <Show
          when={previewFile.latest}
          fallback={
            <Flex
              as="div"
              direction="column"
              class={`${styles.preview} ${styles.stated}`}
            >
              <IconFile aria-hidden="true" />
              <Text
                as="span"
                size={1}
                color="lowContrast"
                selectable={false}
                testId="feed-file-type"
              >
                {props.file.type || 'Unknown type'}
              </Text>
            </Flex>
          }
        >
          {(url) => (
            <Flex as="div" class={styles.preview}>
              <img
                class={styles.image}
                src={url()}
                alt={props.file.name}
                data-testid="feed-file-image"
              />
            </Flex>
          )}
        </Show>
      </Show>

      <Flex as="figcaption" class={styles.caption}>
        <Text as="span" selectable={false} class={styles.label}>
          <Text as="span" size={2} truncate selectable testId="feed-file-name">
            {props.file.name || 'Unnamed file'}
          </Text>
          <Text
            as="span"
            size={1}
            color="lowContrast"
            selectable={false}
            testId="feed-file-size"
          >
            {formatBytes(props.file.size)}
          </Text>
        </Text>

        <Show when={here()}>
          <IconButton
            testId="feed-file-save"
            aria-label="Save"
            variant="ghost"
            color="neutral"
            disabled={saveFile.pending}
            onClick={() => saveFile(props.groupId, props.itemId, props.file)}
          >
            <IconDownload aria-hidden="true" />
          </IconButton>
        </Show>
      </Flex>
    </Flex>
  );
};
