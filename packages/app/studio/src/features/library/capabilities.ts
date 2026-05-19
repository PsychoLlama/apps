import { createLogger } from '@lib/observability';
import type { DeepReadonly } from '@lib/state';
import type { LibraryState } from './store';
import type { Recording } from './types';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/** Persisted shape for a recording — Recording metadata plus the raw blob. */
export interface PersistedRecording {
  id: string;
  name: string;
  duration: number;
  createdAt: number;
  blob: Blob;
}

const STUDIO_DIR = 'studio';
const RECORDINGS_DIR = 'recordings';
const BLOB_FILE = 'blob';
const META_FILE = 'meta.json';

interface RecordingMetadata {
  id: string;
  name: string;
  duration: number;
  createdAt: number;
}

// Module-singleton: one OPFS lookup per page, shared across every
// capability call. Resolving the directory chain isn't expensive but
// avoiding it keeps the hot path quiet. The cached promise self-evicts
// on rejection so a transient failure (storage briefly blocked, etc.)
// doesn't poison every later persist/load for the lifetime of the page.
let dirPromise: Promise<FileSystemDirectoryHandle> | null = null;

const getRecordingsDir = (): Promise<FileSystemDirectoryHandle> => {
  if (dirPromise) return dirPromise;
  const promise = (async () => {
    const root = await navigator.storage.getDirectory();
    const studio = await root.getDirectoryHandle(STUDIO_DIR, { create: true });
    return studio.getDirectoryHandle(RECORDINGS_DIR, { create: true });
  })();
  dirPromise = promise;
  void promise.catch(() => {
    if (dirPromise === promise) dirPromise = null;
  });
  return promise;
};

// Dedupe concurrent reads at the storage layer so two hydrates kicked
// off by overlapping route mounts share fate — one can't fail while
// the other succeeds and gets dropped by the action's `loaded` guard.
// URL.createObjectURL still runs per call so the duplicate filter in
// `loadRecordingsEffect` can revoke its own URLs without aliasing.
let persistedFetch: Promise<PersistedRecording[]> | null = null;

const readRecording = async (
  entry: FileSystemDirectoryHandle,
): Promise<PersistedRecording | null> => {
  try {
    const [metaHandle, blobHandle] = await Promise.all([
      entry.getFileHandle(META_FILE),
      entry.getFileHandle(BLOB_FILE),
    ]);
    const [metaFile, blob] = await Promise.all([
      metaHandle.getFile(),
      blobHandle.getFile(),
    ]);
    const meta = JSON.parse(await metaFile.text()) as RecordingMetadata;
    return { ...meta, blob };
  } catch {
    // Skip half-written or otherwise unreadable directories. A
    // persist that crashed between blob and meta writes lands here.
    return null;
  }
};

const fetchPersisted = (): Promise<PersistedRecording[]> => {
  if (persistedFetch) return persistedFetch;
  const promise = (async () => {
    const dir = await getRecordingsDir();
    const recordings: PersistedRecording[] = [];
    for await (const entry of dir.values()) {
      if (entry.kind !== 'directory') continue;
      const recording = await readRecording(entry);
      if (recording) recordings.push(recording);
    }
    return recordings;
  })();
  persistedFetch = promise;
  void promise.finally(() => {
    if (persistedFetch === promise) persistedFetch = null;
  });
  return promise;
};

/** Release the browser's reference to a blob URL. */
export const revokeRecording = (url: string): void => {
  URL.revokeObjectURL(url);
};

/**
 * Persist a finalized recording's metadata + blob to OPFS. The blob is
 * written first and the metadata file last so a crash mid-write leaves
 * a recording that `readRecording` will skip — better than surfacing a
 * recording with missing media.
 */
export const persistRecording = async (
  recording: PersistedRecording,
): Promise<void> => {
  const dir = await getRecordingsDir();
  const entry = await dir.getDirectoryHandle(recording.id, { create: true });
  const blobHandle = await entry.getFileHandle(BLOB_FILE, { create: true });
  const blobWritable = await blobHandle.createWritable();
  await blobWritable.write(recording.blob);
  await blobWritable.close();
  const metaHandle = await entry.getFileHandle(META_FILE, { create: true });
  const meta: RecordingMetadata = {
    id: recording.id,
    name: recording.name,
    duration: recording.duration,
    createdAt: recording.createdAt,
  };
  const metaWritable = await metaHandle.createWritable();
  await metaWritable.write(JSON.stringify(meta));
  await metaWritable.close();
};

/** Drop a persisted recording from OPFS. */
export const removePersistedRecording = async (id: string): Promise<void> => {
  const dir = await getRecordingsDir();
  try {
    await dir.removeEntry(id, { recursive: true });
  } catch (error) {
    // Already gone (or never persisted) — treat as success so an
    // in-memory-only recording still clears state.
    if (error instanceof DOMException && error.name === 'NotFoundError') return;
    throw error;
  }
};

/**
 * Read every persisted recording, mint blob URLs, and return them in
 * capture order. Callers are responsible for revoking those URLs when
 * the recordings are dropped.
 */
export const loadRecordings = async (): Promise<Recording[]> => {
  const persisted = await fetchPersisted();
  return persisted
    .sort((left, right) => left.createdAt - right.createdAt)
    .map(({ blob, ...meta }) => ({
      ...meta,
      size: blob.size,
      url: URL.createObjectURL(blob),
    }));
};

/**
 * Drop a recording from OPFS and release its blob URL. Persist-side
 * failures are logged but swallowed — state is cleared on the user's
 * delete intent regardless, so a storage-unavailable environment still
 * releases in-memory entries, and a transient failure surfaces again on
 * the next reload. Returns the id so the success action can drop it
 * from state.
 */
export const discardRecording = async (input: {
  id: string;
  url: string;
}): Promise<string> => {
  try {
    await removePersistedRecording(input.id);
  } catch (err) {
    logger.warn('Failed to remove recording from OPFS', {
      error: err instanceof Error ? err : new Error(String(err)),
    });
  }
  revokeRecording(input.url);
  return input.id;
};

/**
 * Hydrate persisted recordings against the live library: short-circuit
 * when the library is already loaded, otherwise return the persisted
 * set filtered against recordings already in state and any tombstoned
 * ids. Freshly-minted URLs for filtered entries are revoked so the
 * browser's reference count doesn't leak.
 */
export const reconcilePersistedRecordings = async (
  library: DeepReadonly<LibraryState>,
): Promise<Recording[] | null> => {
  if (library.loaded) return null;
  const persisted = await loadRecordings();
  const seen = new Set(library.recordings.map((entry) => entry.id));
  const tombstoned = new Set(library.tombstones);
  return persisted.filter((entry) => {
    if (seen.has(entry.id) || tombstoned.has(entry.id)) {
      revokeRecording(entry.url);
      return false;
    }
    return true;
  });
};
