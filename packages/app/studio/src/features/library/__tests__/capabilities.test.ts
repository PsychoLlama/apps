import type { DeepReadonly } from '@lib/state';
import { openDB } from 'idb';
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

// In-memory IDB stand-in. Tests of the capability layer focus on the
// shape of calls and the round-trip — the real `idb` wrapper is a thin
// promise adapter we don't need to exercise here. `delete` is a mock
// function so individual tests can simulate a persist-side failure.
const store = new Map<string, PersistedRecording>();
const idbMocks = vi.hoisted(() => ({
  deleteFn: vi.fn<(storeName: string, key: string) => Promise<void>>(),
}));

vi.mock('idb', () => ({
  openDB: vi.fn(() =>
    Promise.resolve({
      put: (_storeName: string, value: PersistedRecording) => {
        store.set(value.id, value);
        return Promise.resolve();
      },
      delete: idbMocks.deleteFn,
      getAll: () => Promise.resolve([...store.values()]),
    }),
  ),
}));

beforeEach(() => {
  store.clear();
  vi.mocked(openDB).mockClear();
  idbMocks.deleteFn.mockReset().mockImplementation((_storeName, key) => {
    store.delete(key);
    return Promise.resolve();
  });
});

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

describe('persistRecording', () => {
  it('writes the recording into the recordings object store', async () => {
    const recording = sample();

    await persistRecording(recording);

    expect(store.get('rec-1')).toEqual(recording);
  });
});

describe('removePersistedRecording', () => {
  it('deletes the persisted entry', async () => {
    await persistRecording(sample());

    await removePersistedRecording('rec-1');

    expect(store.has('rec-1')).toBe(false);
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

    expect(store.has('rec-x')).toBe(false);
    expect(revoke).toHaveBeenCalledWith('blob:rec-x');
    expect(id).toBe('rec-x');
  });

  it('still revokes the URL and swallows the failure when IDB delete rejects', async () => {
    idbMocks.deleteFn.mockRejectedValueOnce(new Error('disk-fail'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    // State-clearing fallback — the binding's `onSuccess` action runs
    // regardless, so the capability must resolve even on IDB failure so
    // an in-memory-only recording (captured when IDB was unavailable)
    // still deletes. The warning surfaces the persist-side miss.
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
