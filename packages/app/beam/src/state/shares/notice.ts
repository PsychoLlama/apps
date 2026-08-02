import {
  call,
  commit,
  defineFold,
  defineSaga,
  defineStore,
  defineTopic,
} from '@lib/state';
import { copyText, wait } from '../platform/host';
import { beamScope } from '../scope';

/** How long a copy confirmation stays on screen, in milliseconds. */
export const COPY_NOTICE_DURATION = 2000;

/**
 * Which share was just copied, so the row can say so. One at a time: a
 * confirmation is about the tap that happened, and the tap that happened is
 * the most recent one.
 */
export interface CopyNotice {
  /** The share copied most recently, or `null` if the notice has expired. */
  shareId: string | null;
}

/** Which share was just copied. */
export const copyNoticeStore = defineStore<CopyNotice>(beamScope, () => ({
  shareId: null,
}));

/** A share's text went to the clipboard. */
export const shareCopiedTopic = defineTopic<string>();
defineFold(shareCopiedTopic, [copyNoticeStore], (notice, shareId) => {
  notice.shareId = shareId;
});

/**
 * A copy confirmation timed out. Carries the share it was about so a stale
 * timer can't clear a newer notice: copying a second row while the first
 * confirmation is still up replaces it, and the first timer then has nothing
 * of its own left to take down.
 */
export const copyNoticeExpiredTopic = defineTopic<string>();
defineFold(copyNoticeExpiredTopic, [copyNoticeStore], (notice, shareId) => {
  if (notice.shareId === shareId) notice.shareId = null;
});

/**
 * Copy a share's text, and say so for a moment. The confirmation is the
 * whole point of routing this through a saga: the clipboard gives no visible
 * sign it worked, and a button that answers nothing reads as a button that
 * did nothing.
 *
 * Nothing is claimed if the copy was refused — the clipboard is
 * permissioned, and a confirmation for a copy that didn't happen is worse
 * than no confirmation at all.
 */
export const copyShareSaga = defineSaga(
  beamScope,
  async function* (input: { id: string; body: string }) {
    const copied = yield* call(copyText, input.body);
    if (!copied) return;

    yield commit(shareCopiedTopic(input.id));
    yield* call(wait, COPY_NOTICE_DURATION);
    yield commit(copyNoticeExpiredTopic(input.id));
  },
);
