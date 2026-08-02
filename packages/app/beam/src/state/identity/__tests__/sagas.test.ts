/**
 * Unit tests for this device's own sagas. These run under `simulate`, so
 * there's no runtime and no state — IndexedDB, the clock, and the QR encoder
 * are stubbed, and the assertions are about what each saga published and
 * wrote through.
 */

import { simulate } from '@lib/state';
import { removeContact, saveContact } from '../../platform/database';
import { encodeBeamCode } from '../../platform/qr-code';
import { now } from '../../platform/host';
import { deviceNamedTopic, identityStore } from '../identity';
import { codeEncodedTopic } from '../qr-code';
import { encodeInviteSaga, nameDeviceSaga } from '../sagas';
import type { SelfContact } from '../../platform/database';

const SELF_ID = 'ep-self';

const fakeSelf = (overrides: Partial<SelfContact> = {}): SelfContact => ({
  kind: 'self',
  endpointId: SELF_ID,
  label: 'Studio',
  createdAt: 1234,
  ...overrides,
});

/** The identity as the naming path reads it back, after the fold has run. */
const identity = (record: SelfContact | null, endpointId = SELF_ID) => ({
  endpointId,
  record,
});

describe('nameDeviceSaga', () => {
  it('commits the new name and writes the row through', async () => {
    const save = vi.fn();
    const named = fakeSelf({ label: 'Kitchen' });

    const trace = await simulate(nameDeviceSaga('Kitchen'), {
      reads: [[identityStore, identity(named)]],
      calls: [
        [now, () => 5678],
        [saveContact, save],
        [removeContact, vi.fn()],
      ],
    });

    expect(trace.commits).toEqual([
      [deviceNamedTopic({ endpointId: SELF_ID, label: 'Kitchen', at: 5678 })],
    ]);

    // Read back out of the store rather than rebuilt here, so the fold stays
    // the single place that decides what the row looks like.
    expect(save).toHaveBeenCalledWith(expect.any(AbortSignal), named);
    expect(trace.result).toBe(true);
  });

  it('passes an emptied field through as a request to clear', async () => {
    const save = vi.fn();
    const cleared = fakeSelf({ label: null });

    const trace = await simulate(nameDeviceSaga(''), {
      reads: [[identityStore, identity(cleared)]],
      calls: [
        [now, () => 5678],
        [saveContact, save],
        [removeContact, vi.fn()],
      ],
    });

    // Clearing is a real answer: the device drops back to the prefix of its
    // own key, which is a name. The fold decides that, so the field's
    // contents go through untouched. Refusing a blank is setup's rule, and
    // it lives with setup.
    expect(trace.commits).toEqual([
      [deviceNamedTopic({ endpointId: SELF_ID, label: '', at: 5678 })],
    ]);
    expect(save).toHaveBeenCalledWith(expect.any(AbortSignal), cleared);
  });

  it('waits for a key before writing a row keyed by one', async () => {
    const save = vi.fn();

    const trace = await simulate(nameDeviceSaga('Kitchen'), {
      reads: [[identityStore, identity(null, null as unknown as string)]],
      calls: [
        [now, () => 5678],
        [saveContact, save],
        [removeContact, vi.fn()],
      ],
    });

    expect(save).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
    expect(trace.result).toBe(false);
  });

  it('clears the row the key used to answer on', async () => {
    const remove = vi.fn();

    await simulate(nameDeviceSaga('Studio'), {
      reads: [[identityStore, identity(fakeSelf({ endpointId: 'old-key' }))]],
      calls: [
        [now, () => 1234],
        [saveContact, vi.fn()],
        [removeContact, remove],
      ],
    });

    // The name follows the device, and there is only ever one row for it —
    // a rotated key would otherwise leave a second behind, and the read that
    // picked one up would be picking arbitrarily.
    expect(remove).toHaveBeenCalledWith(expect.any(AbortSignal), 'old-key');
  });

  it('leaves the row alone when the key never moved', async () => {
    const remove = vi.fn();

    await simulate(nameDeviceSaga('Kitchen'), {
      reads: [[identityStore, identity(fakeSelf())]],
      calls: [
        [now, () => 1234],
        [saveContact, vi.fn()],
        [removeContact, remove],
      ],
    });

    // A rename is a rename. Deleting the row it's replacing would be a
    // window where this device has no name at all.
    expect(remove).not.toHaveBeenCalled();
  });
});

describe('encodeInviteSaga', () => {
  it('publishes the grid the encoder produced', async () => {
    const grid = { size: 3, modules: new Uint8Array([1, 0, 1]) };

    const trace = await simulate(encodeInviteSaga(SELF_ID), {
      calls: [[encodeBeamCode, () => grid]],
    });

    expect(trace.commits).toEqual([[codeEncodedTopic(grid)]]);
  });

  it('publishes a failed encode rather than leaving it absent', async () => {
    // Non-fatal: the link is still copyable from its text field, so the
    // absence has to be said out loud rather than looking like a pending one.
    const trace = await simulate(encodeInviteSaga(SELF_ID), {
      calls: [[encodeBeamCode, () => null]],
    });

    expect(trace.commits).toEqual([[codeEncodedTopic(null)]]);
  });
});
