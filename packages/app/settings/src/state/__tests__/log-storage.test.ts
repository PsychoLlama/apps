import { createTestController } from '@lib/effects/testing';
import {
  $closeDeletedNotice,
  $deletedNoticeOpen,
  $logsDeleted,
} from '../log-storage';

describe('$deletedNoticeOpen', () => {
  it('starts closed', async () => {
    await using effects = createTestController();
    const deletedNoticeOpen = await effects.run($deletedNoticeOpen);

    expect(deletedNoticeOpen()).toBe(false);
  });
});

describe('$logsDeleted', () => {
  it('shows the notice', async () => {
    await using effects = createTestController();
    const logsDeleted = await effects.run($logsDeleted);
    const deletedNoticeOpen = await effects.run($deletedNoticeOpen);

    logsDeleted();

    expect(deletedNoticeOpen()).toBe(true);
  });
});

describe('$closeDeletedNotice', () => {
  it('closes the notice', async () => {
    await using effects = createTestController();
    const logsDeleted = await effects.run($logsDeleted);
    const closeNotice = await effects.run($closeDeletedNotice);
    const deletedNoticeOpen = await effects.run($deletedNoticeOpen);

    logsDeleted();
    closeNotice();

    expect(deletedNoticeOpen()).toBe(false);
  });
});
