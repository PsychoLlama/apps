/**
 * Saga tests for the Log storage controls. They run under `simulate` — no
 * runtime, no state, just what each one called.
 */

import { simulate } from '@lib/state';
import { deleteLogs } from '../capabilities';
import { deleteLogsSaga } from '../sagas';
import { logsDeletedTopic } from '../log-storage';

describe('deleteLogsSaga', () => {
  it('deletes the logs, then announces it', async () => {
    const clear = vi.fn();

    const trace = await simulate(deleteLogsSaga(), {
      calls: [[deleteLogs, clear]],
    });

    expect(trace.commits).toEqual([[logsDeletedTopic()]]);
    expect(clear).toHaveBeenCalledTimes(1);
  });
});
