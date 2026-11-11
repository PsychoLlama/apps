import { createTestController } from '@lib/effects/testing';
import { deleteLogsDatabase } from '@lib/observability/storage';
import { $deletedNoticeOpen } from '../../state/log-storage';
import { $deleteLogs } from '../log-storage';

vi.mock('@lib/observability/storage', () => ({
  deleteLogsDatabase: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(deleteLogsDatabase).mockReset();
});

describe('$deleteLogs', () => {
  it('deletes the logs, then shows the notice', async () => {
    vi.mocked(deleteLogsDatabase).mockResolvedValue();
    await using effects = createTestController();
    const deleteLogs = await effects.run($deleteLogs);
    const deletedNoticeOpen = await effects.run($deletedNoticeOpen);

    await deleteLogs();

    expect(deleteLogsDatabase).toHaveBeenCalledTimes(1);
    expect(deletedNoticeOpen()).toBe(true);
  });

  it('fails without showing the notice', async () => {
    const error = new Error('Testing failures');
    vi.mocked(deleteLogsDatabase).mockRejectedValue(error);
    await using effects = createTestController();
    const deleteLogs = await effects.run($deleteLogs);
    const deletedNoticeOpen = await effects.run($deletedNoticeOpen);

    const failure = deleteLogs();

    await expect(failure).rejects.toBe(error);
    expect(deletedNoticeOpen()).toBe(false);
  });
});
