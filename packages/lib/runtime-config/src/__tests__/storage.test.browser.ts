import { defineConfig } from '../define-config';
import {
  deleteOverride,
  pruneOverrides,
  readOverride,
  writeOverride,
} from '../storage';

// Wipe the config directory between cases so persisted overrides don't leak.
afterEach(async () => {
  const root = await navigator.storage.getDirectory();
  await root.removeEntry('config', { recursive: true }).catch(() => {});
});

describe('storage with arbitrary option IDs', () => {
  // OPFS rejects these as file names verbatim, so each only round-trips
  // because the ID is encoded before it reaches the file system.
  it.each([
    ['@app/scratchpad'],
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
    await writeOverride('@app/scratchpad', { production: { enabled: true } });
    await deleteOverride('@app/scratchpad');

    expect(await readOverride('@app/scratchpad')).toEqual({});
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

/** Every file name left in the config directory, sorted for comparison. */
const configEntries = async (): Promise<string[]> => {
  const root = await navigator.storage.getDirectory();
  const dir = await root.getDirectoryHandle('config');
  const names: string[] = [];
  for await (const name of dir.keys()) names.push(name);
  return names.sort();
};

describe('pruneOverrides', () => {
  const scratchpad = defineConfig('@app/scratchpad', {
    development: { enabled: true },
    staging: { enabled: true },
    production: { enabled: false },
  });

  it('deletes overrides no known option claims', async () => {
    await writeOverride('@app/scratchpad', { production: { enabled: true } });
    await writeOverride('@app/retired', { production: { enabled: true } });

    await pruneOverrides([scratchpad]);

    expect(await configEntries()).toEqual(['%40app%2Fscratchpad.json']);
    expect(await readOverride('@app/scratchpad')).toEqual({
      production: { enabled: true },
    });
    expect(await readOverride('@app/retired')).toEqual({});
  });

  it('clears the directory when no options are known', async () => {
    await writeOverride('@app/scratchpad', { production: { enabled: true } });

    await pruneOverrides([]);

    expect(await configEntries()).toEqual([]);
  });

  it('deletes unclaimed entries the library never wrote', async () => {
    // The config directory is ours, so a stray file or nested directory is
    // as much garbage as a retired option's override.
    await writeOverride('@app/scratchpad', { production: { enabled: true } });
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle('config');
    await dir.getFileHandle('stray.txt', { create: true });
    await dir.getDirectoryHandle('nested', { create: true });

    await pruneOverrides([scratchpad]);

    expect(await configEntries()).toEqual(['%40app%2Fscratchpad.json']);
  });

  it('resolves without writing when the directory is absent', async () => {
    await expect(pruneOverrides([scratchpad])).resolves.toBeUndefined();

    const root = await navigator.storage.getDirectory();
    await expect(root.getDirectoryHandle('config')).rejects.toThrow();
  });
});
