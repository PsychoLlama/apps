import { call, commit, defineSaga } from '@lib/state';
import { deleteLogs, resetLogFilter, writeLogFilter } from './capabilities';
import { logsDeletedTopic } from './log-storage';
import { advancedSettingsScope } from './scope';

/**
 * Persist a new log filter pattern. Publishes nothing: the write echoes
 * back through the subscription `observeLogFilter` holds.
 */
export const commitLogFilterSaga = defineSaga(
  advancedSettingsScope,
  async function* (pattern: string) {
    yield* call(writeLogFilter, pattern);
  },
);

/**
 * Revert the log filter to its default for the active environment. The
 * reset echoes back through the subscription `observeLogFilter` holds.
 */
export const resetLogFilterSaga = defineSaga(
  advancedSettingsScope,
  async function* () {
    yield* call(resetLogFilter);
  },
);

/** Delete every persisted log, then announce it so the notice can show. */
export const deleteLogsSaga = defineSaga(
  advancedSettingsScope,
  async function* () {
    yield* call(deleteLogs);
    yield commit(logsDeletedTopic());
  },
);
