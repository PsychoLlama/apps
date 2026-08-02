import { createLogger, toError } from '@lib/observability';
import {
  ONBOARDING_STORE,
  SELF_KEY,
  openBeamDatabase,
  type OnboardingRecord,
} from '../database';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Read back how far setting this device up has got, or `null` if nothing was
 * ever written.
 *
 * Rethrows on failure: absent progress means "walk this reader through
 * setup", and a device whose disk merely wouldn't open must not be walked
 * through it again — it may well be finished, with contacts who know it.
 */
export const readOnboarding = async (
  signal: AbortSignal,
): Promise<OnboardingRecord | null> => {
  const database = await openBeamDatabase();

  try {
    const record = await database.get(ONBOARDING_STORE, SELF_KEY);
    signal.throwIfAborted();
    return record ?? null;
  } catch (error) {
    if (!signal.aborted) {
      logger.error('Could not read this device’s setup progress.', {
        error: toError(error),
      });
    }

    throw error;
  } finally {
    database.close();
  }
};

/**
 * Write this device's progress through to IndexedDB.
 *
 * Reports and swallows a failed write, like every other persisted change: the
 * step has already moved in memory, so the reader carries on where they are
 * and the cost is that the next reload asks again.
 */
export const saveOnboarding = async (
  _signal: AbortSignal,
  record: OnboardingRecord,
): Promise<void> => {
  const database = await openBeamDatabase();

  try {
    await database.put(ONBOARDING_STORE, record, SELF_KEY);
  } catch (error) {
    logger.error('Could not persist setup progress; this step may repeat.', {
      step: record.step,
      error: toError(error),
    });
  } finally {
    database.close();
  }
};
