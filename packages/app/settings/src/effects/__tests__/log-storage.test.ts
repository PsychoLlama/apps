import { createTestController } from '@lib/effects/testing';
import { deleteDatabase } from '@lib/holz-idb-backend/database';
import { LOGS_DATABASE } from '@lib/observability/storage';
import { $deletedNoticeOpen } from '../../state/log-storage';
import { $deleteLogs } from '../log-storage';

vi.mock('@lib/holz-idb-backend/database', () => ({
  deleteDatabase: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(deleteDatabase).mockReset();
});

describe('$deleteLogs', () => {
  it('deletes the logs, then shows the notice', async () => {
    vi.mocked(deleteDatabase).mockResolvedValue();
    await using effects = createTestController();
    const deleteLogs = await effects.run($deleteLogs);
    const deletedNoticeOpen = await effects.run($deletedNoticeOpen);

    await deleteLogs();

    expect(deleteDatabase).toHaveBeenCalledExactlyOnceWith(LOGS_DATABASE.name);
    expect(deletedNoticeOpen()).toBe(true);
  });

  it('fails without showing the notice', async () => {
    const error = new Error('Testing failures');
    vi.mocked(deleteDatabase).mockRejectedValue(error);
    await using effects = createTestController();
    const deleteLogs = await effects.run($deleteLogs);
    const deletedNoticeOpen = await effects.run($deletedNoticeOpen);

    const failure = deleteLogs();

    await expect(failure).rejects.toBe(error);
    expect(deletedNoticeOpen()).toBe(false);
  });
});
