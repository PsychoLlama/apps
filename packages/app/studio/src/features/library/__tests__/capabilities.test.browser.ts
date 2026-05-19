/**
 * Behavioral tests for the library's persistence capabilities.
 *
 * OPFS only exists in a real browser — jsdom has no `navigator.storage`
 * surface and the FileSystem* handle classes aren't shimmable in any
 * useful way. Tests run against Playwright/Chromium and read state back
 * through the raw OPFS API to avoid asserting on the capabilities' own
 * output.
 */

import type { DeepReadonly } from '@lib/state';
import {
  discardRecording,
  loadRecordings,
  persistRecording,
  reconcilePersistedRecordings,
  removePersistedRecording,
  revokeRecording,
  type PersistedRecording,
} from '../capabilities';
import type { LibraryState } from '../store';

const sample = (
  overrides: Partial<PersistedRecording> = {},
): PersistedRecording => ({
  id: 'rec-1',
  name: 'Sample',
  duration: 10,
  createdAt: 1745250000000,
  blob: new Blob(['x']),
  ...overrides,
});

const getRecordingsDir = async (): Promise<FileSystemDirectoryHandle> => {
  const root = await navigator.storage.getDirectory();
  const studio = await root.getDirectoryHandle('studio', { create: true });
  return studio.getDirectoryHandle('recordings', { create: true });
};

const clearRecordings = async (): Promise<void> => {
  const dir = await getRecordingsDir();
  const names: string[] = [];
  for await (const entry of dir.values()) names.push(entry.name);
  await Promise.all(
    names.map((name) => dir.removeEntry(name, { recursive: true })),
  );
};

const readPersisted = async (
  id: string,
): Promise<{ blob: Blob; meta: unknown } | null> => {
  const dir = await getRecordingsDir();
  let entry: FileSystemDirectoryHandle;
  try {
    entry = await dir.getDirectoryHandle(id);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'NotFoundError') {
      return null;
    }
    throw err;
  }
  const [blobHandle, metaHandle] = await Promise.all([
    entry.getFileHandle('blob'),
    entry.getFileHandle('meta.json'),
  ]);
  const [blob, metaFile] = await Promise.all([
    blobHandle.getFile(),
    metaHandle.getFile(),
  ]);
  return { blob, meta: JSON.parse(await metaFile.text()) };
};

beforeEach(async () => {
  await clearRecordings();
});

describe('revokeRecording', () => {
  it('releases the blob URL', () => {
    const revoke = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});

    revokeRecording('blob:abc');

    expect(revoke).toHaveBeenCalledWith('blob:abc');
    revoke.mockRestore();
  });
});

describe('persistRecording', () => {
  it('writes the blob and metadata under recordings/<id>', async () => {
    const recording = sample({ blob: new Blob(['hello']) });

    await persistRecording(recording);

    const stored = await readPersisted('rec-1');
    expect(stored).not.toBeNull();
    expect(stored!.meta).toEqual({
      id: 'rec-1',
      name: 'Sample',
      duration: 10,
      createdAt: 1745250000000,
    });
    expect(await stored!.blob.text()).toBe('hello');
  });
});

describe('removePersistedRecording', () => {
  it('deletes the persisted entry', async () => {
    await persistRecording(sample());

    await removePersistedRecording('rec-1');

    expect(await readPersisted('rec-1')).toBeNull();
  });

  it('swallows NotFoundError so deleting an absent id is a no-op', async () => {
    await expect(
      removePersistedRecording('never-persisted'),
    ).resolves.toBeUndefined();
  });
});

describe('loadRecordings', () => {
  it('returns persisted recordings in capture order with minted blob URLs', async () => {
    await persistRecording(sample({ id: 'b', createdAt: 200 }));
    await persistRecording(
      sample({ id: 'a', createdAt: 100, blob: new Blob(['hello']) }),
    );

    const recordings = await loadRecordings();

    expect(recordings.map((entry) => entry.id)).toEqual(['a', 'b']);
    expect(recordings[0]).toMatchObject({
      id: 'a',
      name: 'Sample',
      duration: 10,
      createdAt: 100,
      size: 5,
    });
    expect(recordings[0].url).toMatch(/^blob:/);
    // Cleanup so URL.revokeObjectURL doesn't accumulate browser-side
    // refs between tests.
    for (const recording of recordings) URL.revokeObjectURL(recording.url);
  });

  it('returns an empty array when nothing is persisted', async () => {
    expect(await loadRecordings()).toEqual([]);
  });

  it('mints a fresh URL per call so concurrent revokes do not alias', async () => {
    await persistRecording(sample());

    const [first, second] = await Promise.all([
      loadRecordings(),
      loadRecordings(),
    ]);

    expect(first[0].url).not.toBe(second[0].url);
    URL.revokeObjectURL(first[0].url);
    URL.revokeObjectURL(second[0].url);
  });

  it('skips entries with a missing metadata file', async () => {
    // Simulate a persist that crashed between blob and meta writes —
    // readRecording should drop the half-written directory.
    const dir = await getRecordingsDir();
    const orphan = await dir.getDirectoryHandle('orphan', { create: true });
    const blob = await orphan.getFileHandle('blob', { create: true });
    const writable = await blob.createWritable();
    await writable.write(new Blob(['x']));
    await writable.close();

    expect(await loadRecordings()).toEqual([]);
  });
});

describe('discardRecording', () => {
  it('removes the persisted entry, revokes the URL, and returns the id', async () => {
    await persistRecording(sample({ id: 'rec-x' }));
    const url = URL.createObjectURL(new Blob(['x']));
    const revoke = vi.spyOn(URL, 'revokeObjectURL');

    const id = await discardRecording({ id: 'rec-x', url });

    expect(await readPersisted('rec-x')).toBeNull();
    expect(revoke).toHaveBeenCalledWith(url);
    expect(id).toBe('rec-x');
    revoke.mockRestore();
  });

  it('still revokes the URL when the OPFS removeEntry rejects', async () => {
    // Force a non-NotFoundError from removeEntry by monkey-patching
    // the directory handle the capability already cached. Native
    // method slots are writable, so swapping in a vi.fn for one call
    // exercises the catch path without rebuilding the singleton.
    await persistRecording(sample({ id: 'rec-x' }));
    const dir = await getRecordingsDir();
    const original = dir.removeEntry.bind(dir);
    dir.removeEntry = vi.fn().mockRejectedValueOnce(new Error('disk-fail'));
    const url = URL.createObjectURL(new Blob(['x']));
    const revoke = vi.spyOn(URL, 'revokeObjectURL');

    try {
      const id = await discardRecording({ id: 'rec-x', url });

      expect(revoke).toHaveBeenCalledWith(url);
      expect(id).toBe('rec-x');
    } finally {
      dir.removeEntry = original;
      revoke.mockRestore();
    }
  });
});

describe('reconcilePersistedRecordings', () => {
  const baseLibrary = (
    overrides: Partial<LibraryState> = {},
  ): DeepReadonly<LibraryState> => ({
    loaded: false,
    recordings: [],
    tombstones: [],
    ...overrides,
  });

  it('returns null when the library is already loaded', async () => {
    await persistRecording(sample());

    const result = await reconcilePersistedRecordings(
      baseLibrary({ loaded: true }),
    );

    expect(result).toBeNull();
  });

  it('returns the persisted set when state is empty', async () => {
    await persistRecording(sample({ id: 'a', createdAt: 1 }));
    await persistRecording(sample({ id: 'b', createdAt: 2 }));

    const result = await reconcilePersistedRecordings(baseLibrary());

    expect(result?.map((entry) => entry.id)).toEqual(['a', 'b']);
    for (const recording of result ?? []) URL.revokeObjectURL(recording.url);
  });

  it('filters out entries already in state and revokes their freshly-minted URLs', async () => {
    await persistRecording(sample({ id: 'mid', createdAt: 200 }));
    await persistRecording(sample({ id: 'older', createdAt: 100 }));
    const revoke = vi.spyOn(URL, 'revokeObjectURL');

    const result = await reconcilePersistedRecordings(
      baseLibrary({
        recordings: [
          {
            id: 'mid',
            name: 'mid',
            duration: 5,
            createdAt: 200,
            size: 0,
            url: 'blob:in-memory',
          },
        ],
      }),
    );

    expect(result?.map((entry) => entry.id)).toEqual(['older']);
    // Only the entry already in state should have its URL revoked.
    expect(revoke).toHaveBeenCalledTimes(1);
    revoke.mockRestore();
    for (const recording of result ?? []) URL.revokeObjectURL(recording.url);
  });

  it('filters out tombstoned ids and revokes their freshly-minted URLs', async () => {
    await persistRecording(sample({ id: 'gone', createdAt: 1 }));
    await persistRecording(sample({ id: 'kept', createdAt: 2 }));
    const revoke = vi.spyOn(URL, 'revokeObjectURL');

    const result = await reconcilePersistedRecordings(
      baseLibrary({ tombstones: ['gone'] }),
    );

    expect(result?.map((entry) => entry.id)).toEqual(['kept']);
    expect(revoke).toHaveBeenCalledTimes(1);
    revoke.mockRestore();
    for (const recording of result ?? []) URL.revokeObjectURL(recording.url);
  });
});
