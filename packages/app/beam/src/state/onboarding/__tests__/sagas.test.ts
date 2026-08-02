/**
 * Unit tests for the sagas that move a device through setup. Simulated, so
 * the assertions are about what was published, what reached disk, and — for
 * the guards — what didn't happen at all.
 */

import { simulate } from '@lib/state';
import {
  onboardingAdvancedTopic,
  onboardingLoadFailedTopic,
  onboardingLoadingTopic,
  onboardingRestoredTopic,
  onboardingStore,
} from '../progress';
import { readOnboarding, saveOnboarding } from '../capabilities';
import {
  finishNamingSaga,
  finishPairingSaga,
  restoreOnboardingSaga,
} from '../sagas';
import { deviceNamedTopic } from '../../device/device';
import { saveDeviceName } from '../../device/capabilities';
import { now } from '../../contacts/capabilities';

/** Progress that hasn't been read back yet. */
const unread = () =>
  [
    [onboardingStore, { status: 'initial', step: 'naming', updatedAt: null }],
  ] as const;

/** A device sitting on a given step, with the read already landed. */
const on = (step: string) =>
  [[onboardingStore, { status: 'ready', step, updatedAt: 1 }]] as const;

describe('restoreOnboardingSaga', () => {
  it('reads the stored progress into the scope', async () => {
    const record = { step: 'pairing' as const, updatedAt: 1234 };

    const trace = await simulate(restoreOnboardingSaga(), {
      reads: [...unread()],
      calls: [[readOnboarding, () => record]],
    });

    expect(trace.commits).toEqual([
      [onboardingLoadingTopic()],
      [onboardingRestoredTopic(record)],
    ]);
  });

  it('records unreadable progress rather than none', async () => {
    const trace = await simulate(restoreOnboardingSaga(), {
      reads: [...unread()],
      calls: [
        [
          readOnboarding,
          () => {
            throw new Error('IndexedDB blocked');
          },
        ],
      ],
    });

    expect(trace.commits).toEqual([
      [onboardingLoadingTopic()],
      [onboardingLoadFailedTopic()],
    ]);
  });

  it('leaves progress that has already been read alone', async () => {
    const read = vi.fn();

    const trace = await simulate(restoreOnboardingSaga(), {
      reads: [...on('pairing')],
      calls: [[readOnboarding, read]],
    });

    // A second anchor re-runs this, and without the guard it would drop the
    // reader back onto a step they've since finished.
    expect(read).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });
});

describe('finishNamingSaga', () => {
  it('names the device, then moves it on', async () => {
    const trace = await simulate(finishNamingSaga('Studio'), {
      reads: [...on('naming')],
      calls: [
        [saveDeviceName, vi.fn()],
        [saveOnboarding, vi.fn()],
        [now, () => 1234],
      ],
    });

    // Two transitions, in that order: the name belongs to the device before
    // the step it was asked for is over.
    expect(trace.commits).toEqual([
      [deviceNamedTopic('Studio')],
      [onboardingAdvancedTopic({ step: 'pairing', updatedAt: 1234 })],
    ]);
  });

  it('writes the new step through to disk', async () => {
    const save = vi.fn();

    await simulate(finishNamingSaga('Studio'), {
      reads: [...on('naming')],
      calls: [
        [saveDeviceName, vi.fn()],
        [saveOnboarding, save],
        [now, () => 1234],
      ],
    });

    expect(save).toHaveBeenCalledWith(expect.any(AbortSignal), {
      step: 'pairing',
      updatedAt: 1234,
    });
  });

  it('stays put when the name was refused', async () => {
    const save = vi.fn();

    const trace = await simulate(finishNamingSaga('   '), {
      reads: [...on('naming')],
      calls: [
        [saveDeviceName, vi.fn()],
        [saveOnboarding, save],
        [now, () => 1234],
      ],
    });

    // Nothing to save is nothing to move on from. The form comes back still
    // holding what was typed.
    expect(save).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });

  it('ignores a submit from a step the device has left', async () => {
    const save = vi.fn();

    const trace = await simulate(finishNamingSaga('Second try'), {
      reads: [...on('pairing')],
      calls: [
        [saveDeviceName, save],
        [saveOnboarding, vi.fn()],
        [now, () => 1234],
      ],
    });

    // Guarded on the step rather than on the form, so a stale submit can't
    // walk the device backwards.
    expect(save).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });
});

describe('finishPairingSaga', () => {
  it('ends setup once this device has met another', async () => {
    const save = vi.fn();

    const trace = await simulate(finishPairingSaga(), {
      reads: [...on('pairing')],
      calls: [
        [saveOnboarding, save],
        [now, () => 1234],
      ],
    });

    expect(trace.commits).toEqual([
      [onboardingAdvancedTopic({ step: 'done', updatedAt: 1234 })],
    ]);

    expect(save).toHaveBeenCalledWith(expect.any(AbortSignal), {
      step: 'done',
      updatedAt: 1234,
    });
  });

  it('does nothing for every connection after the first', async () => {
    const save = vi.fn();

    const trace = await simulate(finishPairingSaga(), {
      reads: [...on('done')],
      calls: [
        [saveOnboarding, save],
        [now, () => 1234],
      ],
    });

    // Every peer sighting runs through here, and none of them past the first
    // is a setup step.
    expect(save).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });

  it('leaves an unnamed device on the step that names it', async () => {
    const trace = await simulate(finishPairingSaga(), {
      reads: [...on('naming')],
      calls: [
        [saveOnboarding, vi.fn()],
        [now, () => 1234],
      ],
    });

    // Being dialled while step one is still on screen doesn't excuse the
    // device from having a name — it lands in the caller's address book as
    // the unnamed stranger step one exists to prevent.
    expect(trace.commits).toEqual([]);
  });
});
