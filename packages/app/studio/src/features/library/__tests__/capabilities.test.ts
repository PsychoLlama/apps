import {
  loadRecordings,
  persistRecording,
  removePersistedRecording,
  revokeRecording,
  type PersistedRecording,
} from '../capabilities';

// In-memory IDB stand-in. Tests of the capability layer focus on the
// shape of calls and the round-trip — the real `idb` wrapper is a thin
// promise adapter we don't need to exercise here.
const store = new Map<string, PersistedRecording>();

vi.mock('idb', () => ({
  openDB: vi.fn(() =>
    Promise.resolve({
      put: (_storeName: string, value: PersistedRecording) => {
        store.set(value.id, value);
        return Promise.resolve();
      },
      delete: (_storeName: string, key: string) => {
        store.delete(key);
        return Promise.resolve();
      },
      getAll: () => Promise.resolve([...store.values()]),
    }),
  ),
}));

beforeEach(() => {
  store.clear();
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
    await persistRecording(sample({ id: 'a', createdAt: 100 }));

    const recordings = await loadRecordings();

    expect(recordings.map((entry) => entry.id)).toEqual(['a', 'b']);
    expect(recordings[0]).toEqual({
      id: 'a',
      name: 'Sample',
      duration: 10,
      createdAt: 100,
      url: 'blob:mock',
    });
  });

  it('returns an empty array when nothing is persisted', async () => {
    expect(await loadRecordings()).toEqual([]);
  });
});
