import { clearRootHandle, loadRootHandle } from './persistence';
import type { DirNode, TreeEntry } from './types';

/**
 * Permission API surface the File System Access spec adds to handles
 * but TypeScript's stock DOM lib doesn't model. Inlined per call site
 * so consumers can `as`-cast without dragging in ambient types.
 */
type PermissionState = 'granted' | 'denied' | 'prompt';
type PermissionDescriptor = { mode: 'read' | 'readwrite' };
type PermittedHandle = FileSystemHandle & {
  queryPermission?: (
    descriptor?: PermissionDescriptor,
  ) => Promise<PermissionState>;
  requestPermission?: (
    descriptor?: PermissionDescriptor,
  ) => Promise<PermissionState>;
};

// `FileSystemDirectoryHandle.values()` yields the parent
// `FileSystemHandle` type even though each value is concretely one of
// the two leaf shapes. The DOM lib doesn't declare `kind` as a
// discriminator on the parent, so TypeScript can't narrow on its own —
// these guards do the dispatch.
const isDirectoryHandle = (
  handle: FileSystemHandle,
): handle is FileSystemDirectoryHandle => handle.kind === 'directory';

const isFileHandle = (
  handle: FileSystemHandle,
): handle is FileSystemFileHandle => handle.kind === 'file';

/**
 * Read-only window surface for the bits of the File System Access API
 * we touch. Inlined per call site so consumers don't need ambient
 * `declare global` augmentation reachable through the import graph.
 */
type FileAccessWindow = {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
};

/**
 * Open the platform directory picker. Caller surfaces the chosen handle
 * via `setRootAction`; an `AbortError` (user dismissed the picker) is
 * swallowed by the failure handler so it never reaches the UI.
 */
export const pickDirectory = async (): Promise<FileSystemDirectoryHandle> => {
  const picker = (window as unknown as FileAccessWindow).showDirectoryPicker;
  if (!picker) {
    throw new Error('File System Access API is not supported in this browser.');
  }
  return picker();
};

/**
 * List a directory's children, sorted directories-first then
 * alphabetical, and re-pack each entry into a fresh tree node. The
 * input `node` is threaded through so the success handler can target
 * the originating subtree without a separate path lookup.
 */
export const loadDirectoryChildren = async (
  node: DirNode,
): Promise<{ node: DirNode; entries: TreeEntry[] }> => {
  const entries: TreeEntry[] = [];
  for await (const child of node.handle.values()) {
    if (isDirectoryHandle(child)) {
      entries.push({
        kind: 'directory',
        handle: child,
        expanded: false,
        loadStatus: 'idle',
        children: [],
        loadError: '',
      });
    } else if (isFileHandle(child)) {
      entries.push({ kind: 'file', handle: child });
    }
  }
  entries.sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === 'directory' ? -1 : 1;
    }
    return left.handle.name.localeCompare(right.handle.name);
  });
  return { node, entries };
};

/**
 * Resolve the `File` snapshot for a selected file handle so the
 * metadata pane can show size/type/modified. Bundles the handle into
 * the success payload so the dispatch action only writes through when
 * the selection still points at the same file.
 */
export const loadFileMetadata = async (
  handle: FileSystemFileHandle,
): Promise<{ handle: FileSystemFileHandle; file: File }> => {
  const file = await handle.getFile();
  return { handle, file };
};

/** Outcome of a session-restore attempt. Routed by the success action. */
export type RestoreResult =
  /** A handle was stashed and we still have read access. */
  | { kind: 'granted'; handle: FileSystemDirectoryHandle }
  /** A handle was stashed but the user must re-grant via a gesture. */
  | { kind: 'prompt'; handle: FileSystemDirectoryHandle }
  /** Nothing to restore (fresh session, denied permission, missing API). */
  | { kind: 'none' };

/**
 * Try to restore the previously-picked root from IndexedDB. The
 * permission state is checked passively — `queryPermission` doesn't
 * need a user gesture, so it can run on mount. A `denied` status is
 * treated as "forget the stash" since the OS won't let us regrant
 * without re-picking from scratch.
 */
export const restoreFromStorage = async (): Promise<RestoreResult> => {
  const handle = await loadRootHandle();
  if (!handle) return { kind: 'none' };

  const queryPermission = (handle as PermittedHandle).queryPermission;
  if (typeof queryPermission !== 'function') return { kind: 'none' };

  const status = await queryPermission.call(handle, { mode: 'read' });
  if (status === 'granted') return { kind: 'granted', handle };
  if (status === 'denied') {
    await clearRootHandle();
    return { kind: 'none' };
  }
  return { kind: 'prompt', handle };
};

/**
 * Re-grant read access on a previously-stashed handle. Must be invoked
 * from a user gesture (button click) — `requestPermission` will reject
 * the promise otherwise. Returns the handle on success so the dispatch
 * action can install it as the active root.
 */
export const resumePermission = async (
  handle: FileSystemDirectoryHandle,
): Promise<FileSystemDirectoryHandle> => {
  const requestPermission = (handle as PermittedHandle).requestPermission;
  if (typeof requestPermission !== 'function') {
    throw new Error('Permission API unavailable on this handle.');
  }
  const status = await requestPermission.call(handle, { mode: 'read' });
  if (status !== 'granted') {
    throw new Error('Read permission was denied.');
  }
  return handle;
};
