import type { JsonValue, Override } from './define-option';

/** The OPFS directory all option overrides are persisted under. */
const DIRECTORY = 'runtime-config';

/** One JSON file per option, keyed by the option's ID. */
const fileName = (id: string): string => `${id}.json`;

/**
 * The OPFS root, or `null` where OPFS is unavailable — server-side
 * rendering and any non-browser context. Callers treat `null` as "no
 * persistence": reads resolve to defaults, writes are dropped.
 */
const opfsRoot = async (): Promise<FileSystemDirectoryHandle | null> => {
  if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) {
    return null;
  }

  return navigator.storage.getDirectory();
};

/** A missing directory or file — the cold-start case, not an error. */
const isNotFound = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'NotFoundError';

/**
 * Read the persisted override for an option. Returns an empty override
 * when nothing has been written yet (or OPFS is unavailable), so the
 * caller falls back to defaults for every environment.
 */
export const readOverride = async <Value extends JsonValue>(
  id: string,
): Promise<Override<Value>> => {
  const root = await opfsRoot();
  if (!root) return {};

  try {
    const dir = await root.getDirectoryHandle(DIRECTORY);
    const handle = await dir.getFileHandle(fileName(id));
    const text = await (await handle.getFile()).text();
    return text ? (JSON.parse(text) as Override<Value>) : {};
  } catch (error) {
    if (isNotFound(error)) return {};
    throw error;
  }
};

/** Persist an option's override, replacing whatever was there. */
export const writeOverride = async <Value extends JsonValue>(
  id: string,
  override: Override<Value>,
): Promise<void> => {
  const root = await opfsRoot();
  if (!root) return;

  const dir = await root.getDirectoryHandle(DIRECTORY, { create: true });
  const handle = await dir.getFileHandle(fileName(id), { create: true });
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(override));
  await writable.close();
};

/** Drop an option's override entirely, reverting it to defaults. */
export const deleteOverride = async (id: string): Promise<void> => {
  const root = await opfsRoot();
  if (!root) return;

  try {
    const dir = await root.getDirectoryHandle(DIRECTORY);
    await dir.removeEntry(fileName(id));
  } catch (error) {
    if (isNotFound(error)) return;
    throw error;
  }
};
