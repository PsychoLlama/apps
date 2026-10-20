import { call, commit, defineSaga } from '@lib/state';
import { deleteLogs } from './capabilities';
import { logsDeletedTopic } from './log-storage';
import { advancedSettingsScope } from './scope';

/** Delete every persisted log, then announce it so the notice can show. */
export const deleteLogsSaga = defineSaga(
  advancedSettingsScope,
  async function* () {
    yield* call(deleteLogs);
    yield commit(logsDeletedTopic());
  },
);
