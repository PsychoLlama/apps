import { createLogger, toError } from '@lib/observability';
import { DEVICE_STORE, SELF_KEY, openBeamDatabase } from '../database';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Read back the name this device was given, or `null` if it was never named.
 *
 * Rethrows on failure: a name that couldn't be read is not an absent name,
 * and the caller has to tell the difference — the first is a device whose
 * disk is unreachable, the second is a device nobody has set up.
 */
export const readDeviceName = async (
  signal: AbortSignal,
): Promise<string | null> => {
  const database = await openBeamDatabase();

  try {
    const record = await database.get(DEVICE_STORE, SELF_KEY);
    signal.throwIfAborted();
    return record?.label ?? null;
  } catch (error) {
    if (!signal.aborted) {
      logger.error('Could not read this device’s name.', {
        error: toError(error),
      });
    }

    throw error;
  } finally {
    database.close();
  }
};

/**
 * Write this device's name through to IndexedDB.
 *
 * Reports and swallows a failed write, like the address book does: the name
 * is already in memory by the time this runs, so a failure costs durability
 * rather than the session. It's a sharper loss here than for a contact — the
 * device turns up under its key prefix next reload, and the peers who saved
 * it will still be showing the name they were told — which is what the log is
 * there to explain.
 */
export const saveDeviceName = async (
  _signal: AbortSignal,
  label: string,
): Promise<void> => {
  const database = await openBeamDatabase();

  try {
    await database.put(DEVICE_STORE, { label }, SELF_KEY);
  } catch (error) {
    logger.error('Could not persist this device’s name; it may not survive.', {
      error: toError(error),
    });
  } finally {
    database.close();
  }
};
