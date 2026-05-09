/**
 * Mirror of a directory entry in the lazy tree the user navigates. The
 * tree is rebuilt as the user expands directories — each directory
 * starts at `loadStatus: 'idle'` with empty children, then transitions
 * through `'loading'` to `'loaded'` (or `'failed'`) the first time it
 * expands.
 */
export interface DirNode {
  kind: 'directory';
  handle: FileSystemDirectoryHandle;
  /** Whether the row is showing its children. */
  expanded: boolean;
  /** Async lifecycle for the lazy children load. */
  loadStatus: 'idle' | 'loading' | 'loaded' | 'failed';
  /** Sorted children. Directories first, alphabetical within kind. */
  children: TreeEntry[];
  /** Human-readable error surfaced when `loadStatus === 'failed'`. */
  loadError: string;
}

/** Leaf in the tree — a single file. */
export interface FileNode {
  kind: 'file';
  handle: FileSystemFileHandle;
}

/** Entry rendered as a row in the tree. */
export type TreeEntry = DirNode | FileNode;

/** Currently highlighted row plus its lazily-resolved file metadata. */
export interface Selection {
  /** The directory or file handle. */
  handle: FileSystemHandle;
  /** Names of the ancestor directories, root-first, excluding the handle itself. */
  parentPath: ReadonlyArray<string>;
  /**
   * Resolved `File` snapshot for file selections. Populated asynchronously
   * after the selection lands so the tree highlight is instant.
   */
  file: File | undefined;
}

/** Equality on (handle, ancestry). Handles are stable references per session. */
export const isSameNode = (
  left: Pick<Selection, 'handle' | 'parentPath'> | undefined,
  right: Pick<Selection, 'handle' | 'parentPath'>,
): boolean => {
  if (!left) return false;
  if (left.handle !== right.handle) return false;
  if (left.parentPath.length !== right.parentPath.length) return false;
  return left.parentPath.every(
    (segment, index) => segment === right.parentPath[index],
  );
};
