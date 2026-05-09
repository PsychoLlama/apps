import { For, Show, type Component } from 'solid-js';
import { Flex, Text } from '@lib/ui';
import IconChevron from 'virtual:icons/mdi/chevron-right';
import IconFolder from 'virtual:icons/mdi/folder-outline';
import IconFolderOpen from 'virtual:icons/mdi/folder-open-outline';
import IconFile from 'virtual:icons/mdi/file-outline';
import { isSameNode, type Selection, type TreeEntry } from './types';
import { useFileBrowserActions } from './state';
import * as css from './tree-node.css';

interface TreeNodeProps {
  /** The entry rendered as this row. */
  entry: TreeEntry;
  /** Names of the ancestor directories, root-first, excluding `entry`. */
  parentPath: ReadonlyArray<string>;
  /** Indent depth — multiplied by space[4] in the CSS calc. */
  depth: number;
  /** Live selection so the highlight updates when the user picks elsewhere. */
  selection: Selection | undefined;
}

/**
 * One row in the lazy directory tree. Directories own their own
 * expansion state inside the global store — clicking the row toggles
 * the expansion and triggers a children load on the first open.
 */
export const TreeNode: Component<TreeNodeProps> = (props) => {
  const actions = useFileBrowserActions();

  const handle = () => props.entry.handle;
  const selected = () =>
    isSameNode(props.selection, {
      handle: handle(),
      parentPath: props.parentPath,
    });

  const handleClick = () => {
    actions.select({ handle: handle(), parentPath: props.parentPath });
    if (props.entry.kind === 'directory') actions.toggleExpand(props.entry);
  };

  return (
    <Flex as="li" direction="column">
      {/* Tree rows are custom-styled click targets with no @lib/ui
          analogue — Button enforces variant/size visuals that fight
          the dense, indent-aware row layout. */}
      {/* eslint-disable-next-line custom/require-ui-primitives */}
      <button
        type="button"
        class={css.row}
        data-selected={selected() ? '' : undefined}
        aria-expanded={
          props.entry.kind === 'directory' ? props.entry.expanded : undefined
        }
        style={{ '--tree-depth': props.depth }}
        onClick={handleClick}
      >
        <Show
          when={props.entry.kind === 'directory'}
          fallback={
            <Text
              as="span"
              size={2}
              class={css.chevronSpacer}
              selectable={false}
              aria-hidden
            />
          }
        >
          <IconChevron
            class={`${css.chevron} ${
              props.entry.kind === 'directory' && props.entry.expanded
                ? css.chevronOpen
                : ''
            }`}
            aria-hidden
          />
        </Show>
        <Show
          when={props.entry.kind === 'directory'}
          fallback={<IconFile class={css.icon} aria-hidden />}
        >
          <Show
            when={props.entry.kind === 'directory' && props.entry.expanded}
            fallback={<IconFolder class={css.icon} aria-hidden />}
          >
            <IconFolderOpen class={css.icon} aria-hidden />
          </Show>
        </Show>
        <Text as="span" size={2} selectable={false} class={css.name}>
          {handle().name}
        </Text>
      </button>
      <Show when={props.entry.kind === 'directory' && props.entry.expanded}>
        <DirectoryChildren
          parent={props.entry as Extract<TreeEntry, { kind: 'directory' }>}
          parentPath={[...props.parentPath, handle().name]}
          depth={props.depth + 1}
          selection={props.selection}
        />
      </Show>
    </Flex>
  );
};

interface DirectoryChildrenProps {
  parent: Extract<TreeEntry, { kind: 'directory' }>;
  parentPath: ReadonlyArray<string>;
  depth: number;
  selection: Selection | undefined;
}

/**
 * Children listing for an expanded directory. Splits the load
 * lifecycle into status-specific rows so the tree visibly settles
 * across the idle → loading → loaded/failed transitions.
 */
const DirectoryChildren: Component<DirectoryChildrenProps> = (props) => {
  return (
    <Flex as="ul" direction="column" class={css.list}>
      <Show when={props.parent.loadStatus === 'loading'}>
        <Flex
          as="li"
          class={css.loading}
          style={{ '--tree-depth': props.depth }}
        >
          <Text as="span" size={1} color="lowContrast" selectable={false}>
            Loading…
          </Text>
        </Flex>
      </Show>
      <Show when={props.parent.loadStatus === 'failed'}>
        <Flex
          as="li"
          class={css.failed}
          style={{ '--tree-depth': props.depth }}
        >
          <Text as="span" size={1} color="lowContrast" selectable={false}>
            Couldn’t read directory: {props.parent.loadError}
          </Text>
        </Flex>
      </Show>
      <For each={props.parent.children}>
        {(child) => (
          <TreeNode
            entry={child}
            parentPath={props.parentPath}
            depth={props.depth}
            selection={props.selection}
          />
        )}
      </For>
    </Flex>
  );
};
