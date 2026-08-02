import { createLogger, toError } from '@lib/observability';
import {
  CONTACT_STORE,
  openBeamDatabase,
  type ContactRecord,
} from '../database';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Read the whole contact store back from IndexedDB — every peer, and this
 * device's own row with them. Small by nature, so it loads in full rather
 * than paging.
 *
 * One read for both, and no filtering here: the rows are tagged, and sorting
 * them out is a decision about state rather than about storage. It also means
 * the device's name arrives without waiting on the wasm to say what this
 * device's address is.
 *
 * Rethrows on failure: a book that couldn't be read is not an empty book, and
 * the caller needs to tell the difference to avoid claiming there are no
 * contacts when the truth is unknown.
 */
export const readContacts = async (
  signal: AbortSignal,
): Promise<ContactRecord[]> => {
  const database = await openBeamDatabase();

  try {
    const contacts = await database.getAll(CONTACT_STORE);
    signal.throwIfAborted();
    return contacts;
  } catch (error) {
    if (!signal.aborted) {
      logger.error('Could not read the address book.', {
        error: toError(error),
      });
    }

    throw error;
  } finally {
    database.close();
  }
};

/**
 * Write a record through to IndexedDB, replacing whatever was at its id.
 * Takes either kind — this device's row is written the same way a peer's is,
 * because on disk it is the same kind of thing.
 *
 * Reports and swallows a failed write. The change is already in memory by the
 * time this runs — folds commit first so the UI answers the tap immediately —
 * so a failure costs durability, not the session. Rejecting here would only
 * surface as an unhandled saga failure with nothing to undo.
 */
export const saveContact = async (
  _signal: AbortSignal,
  record: ContactRecord,
): Promise<void> => {
  const database = await openBeamDatabase();

  try {
    await database.put(CONTACT_STORE, record);
  } catch (error) {
    logger.error('Could not persist a contact; the change may not survive.', {
      kind: record.kind,
      endpointId: record.endpointId,
      error: toError(error),
    });
  } finally {
    database.close();
  }
};

/**
 * Delete a contact from IndexedDB. Reports and swallows a failed delete for
 * the same reason as {@link saveContact} — with the sharper edge that a
 * forgotten contact would come back on the next reload, which the log is
 * there to explain.
 */
export const removeContact = async (
  _signal: AbortSignal,
  endpointId: string,
): Promise<void> => {
  const database = await openBeamDatabase();

  try {
    await database.delete(CONTACT_STORE, endpointId);
  } catch (error) {
    logger.error('Could not delete a contact; it may return on reload.', {
      endpointId,
      error: toError(error),
    });
  } finally {
    database.close();
  }
};

/**
 * Wall-clock time in epoch milliseconds. A capability rather than a bare
 * `Date.now()` in a saga: timestamps land in persisted records, and routing
 * the clock through `call` keeps it stubbable and the folds pure.
 *
 * Takes no signal — reading a clock is synchronous and has nothing to unwind,
 * and a capability may always declare fewer parameters than it's handed.
 */
export const now = (): number => Date.now();
