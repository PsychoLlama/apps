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
  restoreFromStorage,
  resumePermission,
  type RestoreResult,
} from './capabilities';
import { stashRootHandle } from './persistence';
import { type DirNode, type Selection, type TreeEntry } from './types';

/** Snapshot of a previously-picked root awaiting a re-grant gesture. */
export interface PendingRestore {
  /** The handle that was stashed during the prior session. */
  handle: FileSystemDirectoryHandle;
  /** Cached display name so the resume button can label itself. */
  name: string;
}

/** Tri-state browser support flag. Stays at `'unknown'` through SSR
 *  so the static HTML doesn't bake in a "not supported" warning that
 *  would survive hydration on a Chromium client. The mount hook flips
 *  it once the real `window` is observable. */
export type SupportStatus = 'unknown' | 'supported' | 'unsupported';

interface FileBrowserState {
  /** Lazily-grown mirror of the picked directory. `undefined` until pick. */
  rootEntry: DirNode | undefined;
  /** Highlighted row, or `undefined` before the user picks anything. */
  selection: Selection | undefined;
  /** Surface-level error from the last picker attempt. AbortError is silent. */
  pickerError: string | undefined;
  /** File System Access support — `'unknown'` until the client resolves it. */
  support: SupportStatus;
  /**
   * Stashed handle from a prior session that needs the user to
   * re-grant read access. Set by the restore effect when the OS
   * reports `permission: 'prompt'`; cleared once the user resumes
   * (or picks a different directory).
   */
  pendingRestore: PendingRestore | undefined;
}

const fileBrowserStore = defineStore<FileBrowserState>(() => ({
  rootEntry: undefined,
  selection: undefined,
  pickerError: undefined,
  support: 'unknown',
  pendingRestore: undefined,
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
    state.pendingRestore = undefined;
  },
);

const routeRestoreResultAction = defineAction(
  [fileBrowserStore],
  (state, result: RestoreResult) => {
    if (result.kind === 'granted') {
      state.rootEntry = {
        kind: 'directory',
        handle: result.handle,
        expanded: true,
        loadStatus: 'idle',
        children: [],
        loadError: '',
      };
      state.selection = {
        handle: result.handle,
        parentPath: [],
        file: undefined,
      };
      state.pickerError = undefined;
      state.pendingRestore = undefined;
    } else if (result.kind === 'prompt') {
      state.pendingRestore = {
        handle: result.handle,
        name: result.handle.name,
      };
    }
  },
);

const setSupportAction = defineAction(
  [fileBrowserStore],
  (state, value: Exclude<SupportStatus, 'unknown'>) => {
    state.support = value;
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

const restoreEffect = defineEffect([], restoreFromStorage, {
  onSuccess: routeRestoreResultAction,
});

const resumeEffect = defineEffect([], resumePermission, {
  onSuccess: setRootAction,
  onFailure: setPickerErrorAction,
});

// Fire-and-forget IDB write. Wrapped as an effect so the side-effect
// goes through the same dispatch path as everything else; no
// lifecycle actions because there's nothing to mirror in state.
const stashEffect = defineEffect([], stashRootHandle);

/** Shape returned by {@link useFileBrowserActions}. */
export interface FileBrowserActions {
  /** Open the platform directory picker. */
  pick: () => Promise<void>;
  /** Toggle a directory's expanded state. Triggers a load on first expand. */
  toggleExpand: (node: DirNode) => void;
  /** Highlight an entry. Files trigger an async metadata fetch. */
  select: (selection: Pick<Selection, 'handle' | 'parentPath'>) => void;
  /** Run feature detection against the live `window`. Call once on mount. */
  detectSupport: () => void;
  /** Try to revive the previously-picked root from IndexedDB. */
  restore: () => Promise<void>;
  /** Re-grant read access on a stashed handle. Must run from a user gesture. */
  resume: () => Promise<void>;
}

export const useFileBrowserActions = (): FileBrowserActions => {
  const pickEffect = useEffect(pickDirectoryEffect);
  const loadChildren = useEffect(loadChildrenEffect);
  const fetchFile = useEffect(loadFileMetadataEffect);
  const restore = useEffect(restoreEffect);
  const resume = useEffect(resumeEffect);
  const stash = useEffect(stashEffect);
  const setExpanded = useAction(setExpandedAction);
  const dispatchSelect = useAction(selectAction);
  const setSupport = useAction(setSupportAction);

  // Shared post-install side-effects. Both pick and resume land at
  // the same end state — a freshly-installed root that needs its
  // children loaded and its handle stashed for next session — so
  // factor it into one helper instead of repeating the dance.
  const settleRoot = (): void => {
    const root = fileBrowser.rootEntry;
    if (!root) return;
    if (root.loadStatus === 'idle') {
      void loadChildren(root as DirNode);
    }
    void stash(root.handle);
  };

  return {
    pick: async () => {
      await pickEffect();
      settleRoot();
    },
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
    detectSupport: () => {
      const picker = (window as unknown as { showDirectoryPicker?: unknown })
        .showDirectoryPicker;
      setSupport(typeof picker === 'function' ? 'supported' : 'unsupported');
    },
    restore: async () => {
      await restore();
      // Restore may install the root (granted path) — settle it the
      // same way pick does. The prompt path leaves rootEntry alone
      // and `settleRoot` no-ops.
      settleRoot();
    },
    resume: async () => {
      const pending = fileBrowser.pendingRestore;
      if (!pending) return;
      await resume(pending.handle);
      settleRoot();
    },
  };
};
