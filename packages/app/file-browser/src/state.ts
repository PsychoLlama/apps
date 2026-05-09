import {
  createStore,
  defineAction,
  defineEffect,
  defineStore,
  useAction,
  useEffect,
} from '@lib/state';
import {
  loadDirectoryChildren,
  loadFileMetadata,
  pickDirectory,
} from './capabilities';
import { type DirNode, type Selection, type TreeEntry } from './types';

interface FileBrowserState {
  /** Lazily-grown mirror of the picked directory. `undefined` until pick. */
  rootEntry: DirNode | undefined;
  /** Highlighted row, or `undefined` before the user picks anything. */
  selection: Selection | undefined;
  /** Surface-level error from the last picker attempt. AbortError is silent. */
  pickerError: string | undefined;
}

const fileBrowserStore = defineStore<FileBrowserState>(() => ({
  rootEntry: undefined,
  selection: undefined,
  pickerError: undefined,
}));

/** Live, readonly view of the file-browser state. */
export const fileBrowser = createStore(fileBrowserStore);

const setRootAction = defineAction(
  [fileBrowserStore],
  (state, handle: FileSystemDirectoryHandle) => {
    state.rootEntry = {
      kind: 'directory',
      handle,
      expanded: true,
      loadStatus: 'idle',
      children: [],
      loadError: '',
    };
    state.selection = { handle, parentPath: [], file: undefined };
    state.pickerError = undefined;
  },
);

const setPickerErrorAction = defineAction(
  [fileBrowserStore],
  (state, error: unknown) => {
    if (error instanceof DOMException && error.name === 'AbortError') {
      // User dismissed the picker — silent, not an error worth surfacing.
      state.pickerError = undefined;
      return;
    }
    state.pickerError = error instanceof Error ? error.message : String(error);
  },
);

// `_state` is the store draft handed to every action. The tree-mutating
// actions below thread the live `DirNode` reference through `payload`
// instead, since walking from `rootEntry` to find the node by path
// would only obscure the mutation. The proxy ref *is* the same object
// the store holds.
const setExpandedAction = defineAction(
  [fileBrowserStore],
  (_state, payload: { node: DirNode; expanded: boolean }) => {
    payload.node.expanded = payload.expanded;
  },
);

const beginLoadChildrenAction = defineAction(
  [fileBrowserStore],
  (_state, node: DirNode) => {
    node.loadStatus = 'loading';
    node.loadError = '';
  },
);

const routeLoadChildrenResultAction = defineAction(
  [fileBrowserStore],
  (
    _state,
    result:
      | { kind: 'ok'; node: DirNode; entries: TreeEntry[] }
      | { kind: 'err'; node: DirNode; error: string },
  ) => {
    if (result.kind === 'ok') {
      result.node.children = result.entries;
      result.node.loadStatus = 'loaded';
    } else {
      result.node.loadStatus = 'failed';
      result.node.loadError = result.error;
    }
  },
);

const selectAction = defineAction(
  [fileBrowserStore],
  (state, selection: Pick<Selection, 'handle' | 'parentPath'>) => {
    state.selection = {
      handle: selection.handle,
      parentPath: selection.parentPath,
      file: undefined,
    };
  },
);

const setSelectionFileAction = defineAction(
  [fileBrowserStore],
  (state, payload: { handle: FileSystemFileHandle; file: File }) => {
    if (!state.selection) return;
    if (state.selection.handle !== payload.handle) return;
    state.selection.file = payload.file;
  },
);

/**
 * Wraps {@link loadDirectoryChildren} so failures land on the same
 * channel as success. Without per-effect failure routing we can't
 * recover the originating node from a thrown error alone, so the
 * capability tags both outcomes with the node and the routing action
 * branches on `kind`.
 */
const loadDirectoryChildrenSafely = async (
  node: DirNode,
): Promise<
  | { kind: 'ok'; node: DirNode; entries: TreeEntry[] }
  | { kind: 'err'; node: DirNode; error: string }
> => {
  try {
    const result = await loadDirectoryChildren(node);
    return { kind: 'ok', node: result.node, entries: result.entries };
  } catch (error) {
    return {
      kind: 'err',
      node,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const pickDirectoryEffect = defineEffect([], pickDirectory, {
  onSuccess: setRootAction,
  onFailure: setPickerErrorAction,
});

const loadChildrenEffect = defineEffect([], loadDirectoryChildrenSafely, {
  onStart: beginLoadChildrenAction,
  onSuccess: routeLoadChildrenResultAction,
});

const loadFileMetadataEffect = defineEffect([], loadFileMetadata, {
  onSuccess: setSelectionFileAction,
});

/** Shape returned by {@link useFileBrowserActions}. */
export interface FileBrowserActions {
  /** Open the platform directory picker. */
  pick: () => Promise<void>;
  /** Toggle a directory's expanded state. Triggers a load on first expand. */
  toggleExpand: (node: DirNode) => void;
  /** Highlight an entry. Files trigger an async metadata fetch. */
  select: (selection: Pick<Selection, 'handle' | 'parentPath'>) => void;
}

export const useFileBrowserActions = (): FileBrowserActions => {
  const pickEffect = useEffect(pickDirectoryEffect);
  const loadChildren = useEffect(loadChildrenEffect);
  const fetchFile = useEffect(loadFileMetadataEffect);
  const setExpanded = useAction(setExpandedAction);
  const dispatchSelect = useAction(selectAction);

  return {
    pick: () => pickEffect(),
    toggleExpand: (node) => {
      const next = !node.expanded;
      setExpanded({ node, expanded: next });
      if (next && node.loadStatus === 'idle') {
        void loadChildren(node);
      }
    },
    select: (selection) => {
      dispatchSelect(selection);
      if (selection.handle.kind === 'file') {
        void fetchFile(selection.handle as FileSystemFileHandle);
      }
    },
  };
};
