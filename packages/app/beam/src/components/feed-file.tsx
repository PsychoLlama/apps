import type { SharedFile } from '@crate/beam';
import { Show } from 'solid-js';
import { Flex, Progress, Text } from '@lib/ui';
import IconFile from 'virtual:icons/mdi/file-outline';
import { formatBytes } from '../state';
import * as styles from './feed-item.css';

/**
 * A shared file, as the body of a feed item: what it's called, how big it
 * is, and how much of it has arrived.
 *
 * The name is another device's word and is only ever rendered as text.
 */
export const FeedFile = (props: {
  /** The file. */
  file: SharedFile;
}) => {
  const here = () => props.file.held >= props.file.size;

  return (
    <Flex as="div" direction="column" gap={2}>
      <Flex as="div" align="center" gap={2}>
        <IconFile width="20" height="20" aria-hidden="true" />
        <Text as="p" selectable class={styles.body} testId="feed-file-name">
          {props.file.name || 'Unnamed file'}
        </Text>
      </Flex>

      {/* Arriving from whichever of the group's devices have it. Nothing
          promises any of them is reachable, so this can sit still. */}
      <Show
        when={here()}
        fallback={
          <Flex as="div" direction="column" gap={1} testId="feed-file-fetching">
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
        <Text
          as="span"
          size={1}
          color="lowContrast"
          selectable={false}
          testId="feed-file-size"
        >
          {formatBytes(props.file.size)}
        </Text>
      </Show>
    </Flex>
  );
};
