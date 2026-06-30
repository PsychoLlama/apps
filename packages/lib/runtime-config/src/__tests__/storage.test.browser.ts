import { deleteOverride, readOverride, writeOverride } from '../storage';

// Wipe the config directory between cases so persisted overrides don't leak.
afterEach(async () => {
  const root = await navigator.storage.getDirectory();
  await root.removeEntry('config', { recursive: true }).catch(() => {});
});

describe('storage with arbitrary option IDs', () => {
  // OPFS rejects these as file names verbatim, so each only round-trips
  // because the ID is encoded before it reaches the file system.
  it.each([
    ['@app/experimental'],
    ['nested/path/like/id'],
    ['..'],
    ['.'],
    ['weird name! (with) spaces'],
    ['accented-café'],
  ])('round-trips an override stored under %j', async (id) => {
    await writeOverride(id, { production: { enabled: true } });

    expect(await readOverride(id)).toEqual({ production: { enabled: true } });
  });

  it('keeps overrides for distinct IDs on separate files', async () => {
    await writeOverride('@app/one', { production: { enabled: true } });
    await writeOverride('@app/two', { production: { enabled: false } });

    expect(await readOverride('@app/one')).toEqual({
      production: { enabled: true },
    });
    expect(await readOverride('@app/two')).toEqual({
      production: { enabled: false },
    });
  });

  it('deletes the override for an encoded ID', async () => {
    await writeOverride('@app/experimental', { production: { enabled: true } });
    await deleteOverride('@app/experimental');

    expect(await readOverride('@app/experimental')).toEqual({});
  });

  it('wraps the override in a versioned, timestamped envelope on disk', async () => {
    await writeOverride('envelope', { production: { enabled: true } });

    // Read the raw bytes to assert the on-disk shape, not the unwrapped view.
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle('config');
    const handle = await dir.getFileHandle('envelope.json');
    const stored = JSON.parse(await (await handle.getFile()).text()) as {
      version: number;
      updatedAt: string;
      config: unknown;
    };

    expect(stored).toMatchObject({
      version: 1,
      config: { production: { enabled: true } },
    });
    expect(typeof stored.updatedAt).toBe('string');
  });
});
