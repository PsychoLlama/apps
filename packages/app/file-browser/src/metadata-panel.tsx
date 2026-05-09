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
            <Text as="span" size={1} color="lowContrast" selectable={false}>
              Heads up: the API follows symlinks transparently — a pnpm
              <Code variant="ghost" color="neutral" size={1} selectable={false}>
                node_modules
              </Code>
              walks through linked workspace packages and the
              <Code variant="ghost" color="neutral" size={1} selectable={false}>
                .pnpm
              </Code>
              store.
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
                placeholder placeholder
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
              <Text as="span" size={2} skeleton selectable={false}>
                placeholder placeholder
              </Text>
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
                placeholder placeholder
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
