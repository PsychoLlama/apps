/**
 * Unit tests for the push-to-pull queue. Two properties matter: nothing
 * pushed is lost whether or not a reader was waiting, and a reader that
 * walks away doesn't take an arrival with it.
 */

import { createInbox } from '../inbox';

/** A signal that has already been aborted, as an ended session leaves one. */
const abortedSignal = (reason: Error): AbortSignal => {
  const controller = new AbortController();
  controller.abort(reason);
  return controller.signal;
};

describe('createInbox', () => {
  it('hands a queued arrival to a later reader', async () => {
    const inbox = createInbox<string>();
    inbox.push('first');

    await expect(inbox.next(new AbortController().signal)).resolves.toBe(
      'first',
    );
  });

  it('hands an arrival straight to a waiting reader', async () => {
    const inbox = createInbox<string>();
    const pending = inbox.next(new AbortController().signal);

    inbox.push('first');

    await expect(pending).resolves.toBe('first');
  });

  it('keeps arrivals in the order they were pushed', async () => {
    const inbox = createInbox<string>();
    const signal = new AbortController().signal;

    inbox.push('first');
    inbox.push('second');

    await expect(inbox.next(signal)).resolves.toBe('first');
    await expect(inbox.next(signal)).resolves.toBe('second');
  });

  it('serves concurrent readers one arrival each', async () => {
    const inbox = createInbox<string>();
    const signal = new AbortController().signal;

    const readers = Promise.all([inbox.next(signal), inbox.next(signal)]);
    inbox.push('first');
    inbox.push('second');

    await expect(readers).resolves.toEqual(['first', 'second']);
  });

  it('rejects a wait the session abandoned', async () => {
    const inbox = createInbox<string>();
    const controller = new AbortController();
    const pending = inbox.next(controller.signal);

    controller.abort(new Error('session ended'));

    await expect(pending).rejects.toThrow('session ended');
  });

  it('rejects immediately when the session is already over', async () => {
    const inbox = createInbox<string>();

    await expect(
      inbox.next(abortedSignal(new Error('session ended'))),
    ).rejects.toThrow('session ended');
  });

  it('does not let an abandoned reader swallow a later arrival', async () => {
    const inbox = createInbox<string>();
    const controller = new AbortController();

    const abandoned = inbox.next(controller.signal);
    controller.abort(new Error('session ended'));
    await expect(abandoned).rejects.toThrow('session ended');

    // The arrival has to survive for whoever reads next; a resolver left
    // behind by a dead loop would have taken it.
    inbox.push('first');
    await expect(inbox.next(new AbortController().signal)).resolves.toBe(
      'first',
    );
  });
});
