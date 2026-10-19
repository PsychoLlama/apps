/**
 * Saga tests for the Advanced section. The write sagas run under
 * `simulate` — no runtime, no state, just what each one called.
 */

import { simulate } from '@lib/state';
import { deleteLogs, resetLogFilter, writeLogFilter } from '../capabilities';
import {
  commitLogFilterSaga,
  deleteLogsSaga,
  resetLogFilterSaga,
} from '../sagas';
import { logsDeletedTopic } from '../log-storage';

describe('write sagas', () => {
  it('commitLogFilterSaga persists its value and commits nothing', async () => {
    const write = vi.fn();

    const trace = await simulate(commitLogFilterSaga('app:*'), {
      calls: [[writeLogFilter, write]],
    });

    // Nothing is published here on purpose: the write echoes back through
    // the subscription `observeLogFilter` holds.
    expect(trace.commits).toEqual([]);
    expect(write).toHaveBeenCalledWith(expect.anything(), 'app:*');
  });

  it('resetLogFilterSaga clears its override and commits nothing', async () => {
    const clear = vi.fn();

    const trace = await simulate(resetLogFilterSaga(), {
      calls: [[resetLogFilter, clear]],
    });

    expect(trace.commits).toEqual([]);
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('deleteLogsSaga deletes the logs, then announces it', async () => {
    const clear = vi.fn();

    const trace = await simulate(deleteLogsSaga(), {
      calls: [[deleteLogs, clear]],
    });

    expect(trace.commits).toEqual([[logsDeletedTopic()]]);
    expect(clear).toHaveBeenCalledTimes(1);
  });
});
