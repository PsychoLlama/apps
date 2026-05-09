import type { DirNode, TreeEntry } from './types';

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
