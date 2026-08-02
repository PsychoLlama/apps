/**
 * Unit tests for the copy confirmation. One notice at a time, and a stale
 * timer must never take down the one that replaced it.
 */

import { createTestRuntime, simulate } from '@lib/state';
import { copyText, wait } from '../../platform/host';
import {
  copyShareSaga,
  COPY_NOTICE_DURATION,
  copyNoticeExpiredTopic,
  copyNoticeStore,
  shareCopiedTopic,
} from '../notice';
import { beamScope } from '../../scope';

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(beamScope);
  return runtime;
};

describe('the copy notice', () => {
  it('names the share that was just copied', () => {
    const { commit, peek } = setup();

    commit(shareCopiedTopic('share-1'));

    expect(peek(copyNoticeStore).shareId).toBe('share-1');
  });

  it('takes itself away when its own timer runs out', () => {
    const { commit, peek } = setup();
    commit(shareCopiedTopic('share-1'));

    commit(copyNoticeExpiredTopic('share-1'));

    expect(peek(copyNoticeStore).shareId).toBeNull();
  });

  it('leaves a newer notice alone', () => {
    const { commit, peek } = setup();
    commit(shareCopiedTopic('share-1'));
    commit(shareCopiedTopic('share-2'));

    commit(copyNoticeExpiredTopic('share-1'));

    // The first row's timer is still running when the second is copied. It
    // has nothing of its own left to take down.
    expect(peek(copyNoticeStore).shareId).toBe('share-2');
  });
});

describe('copyShareSaga', () => {
  it('copies the body and says so for a moment', async () => {
    const copy = vi.fn(() => true);
    const sleep = vi.fn();

    const trace = await simulate(
      copyShareSaga({ id: 'share-1', body: 'kettle is on' }),
      {
        calls: [
          [copyText, copy],
          [wait, sleep],
        ],
      },
    );

    expect(copy).toHaveBeenCalledWith(expect.any(AbortSignal), 'kettle is on');
    expect(sleep).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      COPY_NOTICE_DURATION,
    );
    expect(trace.commits).toEqual([
      [shareCopiedTopic('share-1')],
      [copyNoticeExpiredTopic('share-1')],
    ]);
  });

  it('claims nothing when the clipboard refuses', async () => {
    const trace = await simulate(
      copyShareSaga({ id: 'share-1', body: 'kettle is on' }),
      {
        calls: [
          [copyText, () => false],
          [wait, vi.fn()],
        ],
      },
    );

    // A confirmation for a copy that didn't happen is worse than none.
    expect(trace.commits).toEqual([]);
  });
});
