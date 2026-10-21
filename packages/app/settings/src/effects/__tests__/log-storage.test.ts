import { createTestController } from '@lib/effects/testing';
import { clearLogs } from '@lib/holz-idb-backend';
import type * as IdbBackend from '@lib/holz-idb-backend';
import { $deletedNoticeOpen } from '../../state/log-storage';
import { $deleteLogs } from '../log-storage';

vi.mock('@lib/holz-idb-backend', async (importOriginal) => ({
  ...(await importOriginal<typeof IdbBackend>()),
  clearLogs: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(clearLogs).mockReset();
});

describe('$deleteLogs', () => {
  it('deletes the logs, then shows the notice', async () => {
    vi.mocked(clearLogs).mockResolvedValue();
    await using effects = createTestController();
    const deleteLogs = await effects.run($deleteLogs);
    const deletedNoticeOpen = await effects.run($deletedNoticeOpen);

    await deleteLogs();

    expect(clearLogs).toHaveBeenCalledTimes(1);
    expect(deletedNoticeOpen()).toBe(true);
  });

  it('fails without showing the notice', async () => {
    const error = new Error('Testing failures');
    vi.mocked(clearLogs).mockRejectedValue(error);
    await using effects = createTestController();
    const deleteLogs = await effects.run($deleteLogs);
    const deletedNoticeOpen = await effects.run($deletedNoticeOpen);

    const failure = deleteLogs();

    await expect(failure).rejects.toBe(error);
    expect(deletedNoticeOpen()).toBe(false);
  });
});
