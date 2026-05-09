import { Show, type Component } from 'solid-js';
import {
  Code,
  DataListItem,
  DataListLabel,
  DataListRoot,
  DataListValue,
  Flex,
  Heading,
  Text,
} from '@lib/ui';
import IconFile from 'virtual:icons/mdi/file-outline';
import IconFolder from 'virtual:icons/mdi/folder-outline';
import { formatBytes, formatDate } from './format';
import type { Selection } from './types';
import * as css from './metadata-panel.css';

interface MetadataPanelProps {
  /** The currently highlighted entry, or `undefined` before pick. */
  selection: Selection | undefined;
  /** Name of the picked root directory, used to render the absolute path. */
  rootName: string | undefined;
}

/**
 * Right-pane summary of whatever the user has selected. File metadata
 * (size, MIME, modified) lazy-loads via the store; the labels stay
 * scaffolded so the layout doesn't reflow as the `File` resolves.
 */
export const MetadataPanel: Component<MetadataPanelProps> = (props) => {
  return (
    <Flex as="section" direction="column" gap={5} p={5} class={css.root}>
      <Show
        when={props.selection}
        fallback={
          <Flex
            as="div"
            direction="column"
            gap={2}
            p={6}
            class={css.placeholder}
          >
            <Text as="p" size={3} color="lowContrast" selectable={false}>
              Pick a directory to start exploring.
            </Text>
            <Text as="span" size={2} color="lowContrast" selectable={false}>
              Files and directories stay on your device. Nothing is uploaded.
            </Text>
          </Flex>
        }
        keyed
      >
        {(selection) => (
          <SelectionDetails selection={selection} rootName={props.rootName} />
        )}
      </Show>
    </Flex>
  );
};

interface SelectionDetailsProps {
  selection: Selection;
  rootName: string | undefined;
}

const SelectionDetails: Component<SelectionDetailsProps> = (props) => {
  const isDirectory = () => props.selection.handle.kind === 'directory';

  const segments = (): ReadonlyArray<string> => {
    const root = props.rootName ? [props.rootName] : [];
    return [
      ...root,
      ...props.selection.parentPath,
      props.selection.handle.name,
    ];
  };

  return (
    <>
      <Flex as="header" direction="column" gap={2}>
        <Flex as="div" align="center" gap={3}>
          <Show
            when={isDirectory()}
            fallback={<IconFile width="28" height="28" aria-hidden />}
          >
            <IconFolder width="28" height="28" aria-hidden />
          </Show>
          <Heading as="h2" size={5} trim="both" wrap="pretty" selectable>
            {props.selection.handle.name}
          </Heading>
        </Flex>
        <Text as="p" size={2} color="lowContrast" selectable={false}>
          {isDirectory() ? 'Directory' : 'File'}
        </Text>
      </Flex>

      <DataListRoot orientation="horizontal" size={2}>
        <DataListItem>
          <DataListLabel>Name</DataListLabel>
          <DataListValue>{props.selection.handle.name}</DataListValue>
        </DataListItem>
        <DataListItem align="start">
          <DataListLabel>Path</DataListLabel>
          <DataListValue>
            <Code
              variant="ghost"
              color="neutral"
              size={2}
              selectable
              class={css.path}
            >
              {segments().join('/') || '/'}
            </Code>
          </DataListValue>
        </DataListItem>
        <DataListItem>
          <DataListLabel>Kind</DataListLabel>
          <DataListValue>{props.selection.handle.kind}</DataListValue>
        </DataListItem>
        <Show when={!isDirectory()}>
          <FileMetadata file={props.selection.file} />
        </Show>
      </DataListRoot>
    </>
  );
};

interface FileMetadataProps {
  file: File | undefined;
}

// Skeleton placeholder strings sized to plausible final values so
// the row width doesn't pop on resolve. Each is meaningless text —
// `<Text skeleton>` paints over the glyphs.
const SKELETON_SIZE = '12.3 KB · 12,345 bytes';
const SKELETON_MIME = 'application/octet-stream';
const SKELETON_DATE = 'Jan 1, 2026, 12:00:00 PM';

const FileMetadata: Component<FileMetadataProps> = (props) => {
  return (
    <>
      <DataListItem>
        <DataListLabel>Size</DataListLabel>
        <DataListValue>
          <Show
            when={props.file}
            fallback={
              <Text as="span" size={2} skeleton selectable={false}>
                {SKELETON_SIZE}
              </Text>
            }
            keyed
          >
            {(file) => (
              <>
                {formatBytes(file.size)}
                {' · '}
                {file.size.toLocaleString()} bytes
              </>
            )}
          </Show>
        </DataListValue>
      </DataListItem>
      <DataListItem>
        <DataListLabel>MIME type</DataListLabel>
        <DataListValue>
          <Show
            when={props.file}
            fallback={
              <Code
                variant="ghost"
                color="neutral"
                size={2}
                skeleton
                selectable
              >
                {SKELETON_MIME}
              </Code>
            }
            keyed
          >
            {(file) => (
              <Code variant="ghost" color="neutral" size={2} selectable>
                {file.type || 'unknown'}
              </Code>
            )}
          </Show>
        </DataListValue>
      </DataListItem>
      <DataListItem>
        <DataListLabel>Modified</DataListLabel>
        <DataListValue>
          <Show
            when={props.file}
            fallback={
              <Text as="span" size={2} skeleton selectable={false}>
                {SKELETON_DATE}
              </Text>
            }
            keyed
          >
            {(file) => formatDate(file.lastModified)}
          </Show>
        </DataListValue>
      </DataListItem>
    </>
  );
};
