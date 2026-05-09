import { Show, type Component } from 'solid-js';
import { Button, Callout, Flex } from '@lib/ui';
import { SiteHeader } from '@lib/shell';
import IconFolderOpen from 'virtual:icons/mdi/folder-open-outline';
import { MetadataPanel } from './metadata-panel';
import { TreeNode } from './tree-node';
import { fileBrowser, useFileBrowserActions } from './state';
import type { DirNode } from './types';
import * as css from './index.css';

// `@lib/state` exposes the store as a `DeepReadonly` view. The tree
// types model the mutable shape that actions receive — at the
// component boundary the runtime values are identical, so we cast
// back to the mutable type once and let the rest of the tree consume
// it normally.
const asTreeRoot = (entry: typeof fileBrowser.rootEntry): DirNode | undefined =>
  entry as DirNode | undefined;

const isFileSystemAccessSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  const picker = (window as unknown as { showDirectoryPicker?: unknown })
    .showDirectoryPicker;
  return typeof picker === 'function';
};

/**
 * File-browser POC backed by the File System Access API. The picker
 * yields a `FileSystemDirectoryHandle`; from there the tree expands
 * lazily and the right pane shows metadata for whatever the user has
 * highlighted. No previews — just `kind`, `size`, `type`, `modified`.
 */
export const FileBrowser: Component = () => {
  const actions = useFileBrowserActions();
  const supported = isFileSystemAccessSupported();

  const handlePick = () => {
    void actions.pick();
  };

  return (
    <Flex as="main" direction="column" grow>
      <SiteHeader title="File Browser" />

      <Flex as="div" direction="column" class={css.workspace}>
        <Flex as="header" align="center" gap={2} class={css.toolbar}>
          <Button
            testId="file-browser-pick"
            size={2}
            variant="soft"
            color="accent"
            disabled={!supported}
            onClick={handlePick}
          >
            <IconFolderOpen aria-hidden /> Pick directory
          </Button>
        </Flex>

        <Flex as="div" class={css.body}>
          <Flex as="aside" direction="column" class={css.tree}>
            <Show when={!supported}>
              <Callout color="warning" class={css.callout}>
                The File System Access API isn’t available in this browser. Try
                a Chromium-based browser on desktop.
              </Callout>
            </Show>
            <Show when={fileBrowser.pickerError} keyed>
              {(message) => (
                <Callout color="danger" class={css.callout}>
                  {message}
                </Callout>
              )}
            </Show>
            <Flex
              as="nav"
              direction="column"
              class={css.treeScroll}
              aria-label="Picked directory"
            >
              <Show when={asTreeRoot(fileBrowser.rootEntry)} keyed>
                {(root) => (
                  <Flex as="ul" direction="column">
                    <TreeNode
                      entry={root}
                      parentPath={[]}
                      depth={0}
                      selection={fileBrowser.selection}
                    />
                  </Flex>
                )}
              </Show>
            </Flex>
          </Flex>

          <Flex as="section" class={css.detail} aria-label="Selection details">
            <MetadataPanel
              selection={fileBrowser.selection}
              rootName={fileBrowser.rootEntry?.handle.name}
            />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};
