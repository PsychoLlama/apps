import type { JsonValue, Override } from './define-option';

/** The OPFS directory all option overrides are persisted under. */
const DIRECTORY = 'config';

/** One JSON file per option, keyed by the option's ID. */
const fileName = (id: string): string => `${id}.json`;

/**
 * The OPFS root, or `null` where OPFS is unavailable — server-side
 * rendering and any non-browser context, but also a browser that exposes
 * the API yet refuses to serve it (see {@link isUnavailable}). Callers
 * treat `null` as "no persistence": reads resolve to defaults, writes are
 * dropped.
 */
const opfsRoot = async (): Promise<FileSystemDirectoryHandle | null> => {
  if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) {
    return null;
  }

  try {
    return await navigator.storage.getDirectory();
  } catch (error) {
    // Safari's private browsing exposes `getDirectory` but denies the call
    // with a `SecurityError` — OPFS is walled off, not faulty. Degrade to
    // "no persistence" rather than letting it bubble up as a crash.
    if (isUnavailable(error)) return null;
    throw error;
  }
};

/**
 * Errors from an OPFS operation that mean "fall back to defaults" rather
 * than a genuine fault to surface:
 *
 * - `NotFoundError` — a missing directory or file, the cold-start case.
 * - `SecurityError` — storage walled off or unmappable, e.g. Safari private
 *   browsing denying `getDirectory`, or the agent failing to map the dir.
 * - `NotAllowedError` — storage access not granted.
 */
const isUnavailable = (error: unknown): boolean =>
  error instanceof DOMException &&
  (error.name === 'NotFoundError' ||
    error.name === 'SecurityError' ||
    error.name === 'NotAllowedError');

/**
 * Read the persisted override for an option. Returns an empty override
 * when nothing has been written yet, OPFS is unavailable, or the stored
 * file is unreadable (corrupt JSON), so the caller falls back to defaults
 * for every environment.
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
    // A `SyntaxError` means the persisted file is corrupt — drop it on the
    // floor and revert to defaults rather than wedging every read of the
    // option; the next write replaces it.
    if (isUnavailable(error) || error instanceof SyntaxError) return {};
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
    if (isUnavailable(error)) return;
    throw error;
  }
};
