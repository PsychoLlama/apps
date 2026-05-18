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

// In-memory OPFS stand-in. Tests of the capability layer focus on the
// shape of calls and the blob+meta round-trip — the real FileSystem
// handle API is a thin DOM wrapper we don't need to exercise here.
// `removeEntry` on the recordings dir is a `vi.fn` so individual tests
// can simulate a persist-side failure.

class FakeFileHandle {
  kind = 'file' as const;
  name: string;
  private parent: FakeDirHandle;

  constructor(name: string, parent: FakeDirHandle) {
    this.name = name;
    this.parent = parent;
  }

  getFile(): Promise<Blob> {
    return Promise.resolve(this.parent.fileData.get(this.name) ?? new Blob());
  }

  createWritable(): Promise<{
    write: (data: Blob | string | BufferSource) => Promise<void>;
    close: () => Promise<void>;
  }> {
    const chunks: Blob[] = [];
    const parent = this.parent;
    const name = this.name;
    return Promise.resolve({
      write(data: Blob | string | BufferSource): Promise<void> {
        if (data instanceof Blob) chunks.push(data);
        else if (typeof data === 'string') chunks.push(new Blob([data]));
        else chunks.push(new Blob([data]));
        return Promise.resolve();
      },
      close(): Promise<void> {
        parent.fileData.set(name, new Blob(chunks));
        return Promise.resolve();
      },
    });
  }
}

class FakeDirHandle {
  kind = 'directory' as const;
  name: string;
  children = new Map<string, FakeDirHandle>();
  fileData = new Map<string, Blob>();
  private fileHandles = new Map<string, FakeFileHandle>();
  removeEntry =
    vi.fn<(name: string, opts?: { recursive?: boolean }) => Promise<void>>();

  constructor(name: string) {
    this.name = name;
  }

  getDirectoryHandle(
    name: string,
    opts?: { create?: boolean },
  ): Promise<FakeDirHandle> {
    let child = this.children.get(name);
    if (!child) {
      if (!opts?.create) {
        return Promise.reject(new DOMException('not found', 'NotFoundError'));
      }
      child = new FakeDirHandle(name);
      this.children.set(name, child);
    }
    return Promise.resolve(child);
  }

  getFileHandle(
    name: string,
    opts?: { create?: boolean },
  ): Promise<FakeFileHandle> {
    let handle = this.fileHandles.get(name);
    if (!handle) {
      if (!opts?.create && !this.fileData.has(name)) {
        return Promise.reject(new DOMException('not found', 'NotFoundError'));
      }
      handle = new FakeFileHandle(name, this);
      this.fileHandles.set(name, handle);
    }
    return Promise.resolve(handle);
  }

  // Sync generator: `for await` accepts either sync or async iterables,
  // so we don't need an async generator just to satisfy the consumer.
  *values(): Iterable<FakeDirHandle> {
    for (const child of this.children.values()) yield child;
  }

  clear(): void {
    this.children.clear();
    this.fileData.clear();
    this.fileHandles.clear();
  }
}

const rootDir = new FakeDirHandle('');
const studioDir = new FakeDirHandle('studio');
const recordingsDir = new FakeDirHandle('recordings');
rootDir.children.set('studio', studioDir);
studioDir.children.set('recordings', recordingsDir);

const defaultRemove = (name: string): Promise<void> => {
  if (!recordingsDir.children.delete(name)) {
    return Promise.reject(new DOMException('not found', 'NotFoundError'));
  }
  return Promise.resolve();
};

Object.defineProperty(navigator, 'storage', {
  value: { getDirectory: () => Promise.resolve(rootDir) },
  configurable: true,
  writable: true,
});

beforeEach(() => {
  recordingsDir.clear();
  recordingsDir.removeEntry.mockReset().mockImplementation(defaultRemove);
});

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

const readPersisted = async (
  id: string,
): Promise<PersistedRecording | null> => {
  const dir = recordingsDir.children.get(id);
  if (!dir) return null;
  const blob = dir.fileData.get('blob');
  const metaBlob = dir.fileData.get('meta.json');
  if (!blob || !metaBlob) return null;
  const meta = JSON.parse(await metaBlob.text()) as {
    id: string;
    name: string;
    duration: number;
    createdAt: number;
  };
  return { ...meta, blob };
};

describe('revokeRecording', () => {
  it('releases the blob URL', () => {
    const revoke = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(),
      revokeObjectURL: revoke,
    });

    revokeRecording('blob:abc');

    expect(revoke).toHaveBeenCalledWith('blob:abc');
    vi.unstubAllGlobals();
  });
});

describe('persistRecording', () => {
  it('writes the blob and metadata under recordings/<id>', async () => {
    const recording = sample({ blob: new Blob(['hello']) });

    await persistRecording(recording);

    const stored = await readPersisted('rec-1');
    expect(stored).not.toBeNull();
    expect(stored!.id).toBe('rec-1');
    expect(stored!.name).toBe('Sample');
    expect(stored!.duration).toBe(10);
    expect(stored!.createdAt).toBe(1745250000000);
    expect(await stored!.blob.text()).toBe('hello');
  });
});

describe('removePersistedRecording', () => {
  it('deletes the persisted entry', async () => {
    await persistRecording(sample());

    await removePersistedRecording('rec-1');

    expect(recordingsDir.children.has('rec-1')).toBe(false);
  });

  it('swallows NotFoundError so deleting an absent id is a no-op', async () => {
    await expect(
      removePersistedRecording('never-persisted'),
    ).resolves.toBeUndefined();
  });
});

describe('loadRecordings', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns persisted recordings in capture order with minted blob URLs', async () => {
    await persistRecording(sample({ id: 'b', createdAt: 200 }));
    await persistRecording(
      sample({ id: 'a', createdAt: 100, blob: new Blob(['hello']) }),
    );

    const recordings = await loadRecordings();

    expect(recordings.map((entry) => entry.id)).toEqual(['a', 'b']);
    expect(recordings[0]).toEqual({
      id: 'a',
      name: 'Sample',
      duration: 10,
      createdAt: 100,
      size: 5,
      url: 'blob:mock',
    });
  });

  it('returns an empty array when nothing is persisted', async () => {
    expect(await loadRecordings()).toEqual([]);
  });

  it('mints a fresh URL per call so concurrent revokes do not alias', async () => {
    await persistRecording(sample());
    let counter = 0;
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => `blob:mock-${counter++}`),
      revokeObjectURL: vi.fn(),
    });

    const [first, second] = await Promise.all([
      loadRecordings(),
      loadRecordings(),
    ]);

    expect(first[0].url).not.toBe(second[0].url);
  });

  it('skips entries with a missing metadata file', async () => {
    // A persist that crashed between blob and meta writes leaves a
    // directory with no meta.json — readRecording should drop it.
    const orphan = await recordingsDir.getDirectoryHandle('orphan', {
      create: true,
    });
    const blob = await orphan.getFileHandle('blob', { create: true });
    const writable = await blob.createWritable();
    await writable.write(new Blob(['x']));
    await writable.close();

    expect(await loadRecordings()).toEqual([]);
  });
});

describe('discardRecording', () => {
  let revoke: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    revoke = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: vi.fn(), revokeObjectURL: revoke });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('removes the persisted entry, revokes the URL, and returns the id', async () => {
    await persistRecording(sample({ id: 'rec-x' }));

    const id = await discardRecording({ id: 'rec-x', url: 'blob:rec-x' });

    expect(recordingsDir.children.has('rec-x')).toBe(false);
    expect(revoke).toHaveBeenCalledWith('blob:rec-x');
    expect(id).toBe('rec-x');
  });

  it('still revokes the URL and swallows the failure when the OPFS removeEntry rejects', async () => {
    recordingsDir.removeEntry.mockRejectedValueOnce(new Error('disk-fail'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    // State-clearing fallback — the binding's `onSuccess` action runs
    // regardless, so the capability must resolve even on OPFS failure
    // so an in-memory-only recording (captured when OPFS was
    // unavailable) still deletes. The warning surfaces the
    // persist-side miss.
    const id = await discardRecording({ id: 'rec-x', url: 'blob:rec-x' });

    expect(revoke).toHaveBeenCalledWith('blob:rec-x');
    expect(id).toBe('rec-x');
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('remove'),
      expect.any(Error),
    );
    warn.mockRestore();
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

  let revoke: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    let counter = 0;
    revoke = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => `blob:disk-${counter++}`),
      revokeObjectURL: revoke,
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
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
  });

  it('filters out entries already in state and revokes their freshly-minted URLs', async () => {
    await persistRecording(sample({ id: 'mid', createdAt: 200 }));
    await persistRecording(sample({ id: 'older', createdAt: 100 }));

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
    // loadRecordings sorts by createdAt, so 'older' (100) is minted
    // first (counter=0) and 'mid' (200) second (counter=1). 'mid' is
    // the one already in state, so it's the only URL revoked.
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith('blob:disk-1');
  });

  it('filters out tombstoned ids and revokes their freshly-minted URLs', async () => {
    await persistRecording(sample({ id: 'gone', createdAt: 1 }));
    await persistRecording(sample({ id: 'kept', createdAt: 2 }));

    const result = await reconcilePersistedRecordings(
      baseLibrary({ tombstones: ['gone'] }),
    );

    expect(result?.map((entry) => entry.id)).toEqual(['kept']);
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith('blob:disk-0');
  });
});
