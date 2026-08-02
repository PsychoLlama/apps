/**
 * Unit tests for the device name's sagas. Both run under `simulate`, so the
 * assertions are about what was published and what reached disk.
 */

import { simulate } from '@lib/state';
import {
  deviceLoadFailedTopic,
  deviceLoadingTopic,
  deviceNamedTopic,
  deviceRestoredTopic,
  deviceStore,
} from '../device';
import { readDeviceName, saveDeviceName } from '../capabilities';
import { nameDeviceSaga, restoreDeviceSaga } from '../sagas';

/** A device whose name hasn't been read back yet. */
const unread = () =>
  [[deviceStore, { status: 'initial', label: null }]] as const;

describe('restoreDeviceSaga', () => {
  it('reads the stored name into the scope', async () => {
    const trace = await simulate(restoreDeviceSaga(), {
      reads: [...unread()],
      calls: [[readDeviceName, () => 'Studio']],
    });

    expect(trace.commits).toEqual([
      [deviceLoadingTopic()],
      [deviceRestoredTopic('Studio')],
    ]);
  });

  it('records an unreadable name rather than an absent one', async () => {
    const trace = await simulate(restoreDeviceSaga(), {
      reads: [...unread()],
      calls: [
        [
          readDeviceName,
          () => {
            throw new Error('IndexedDB blocked');
          },
        ],
      ],
    });

    // A name we couldn't read is not a device nobody named, and treating it
    // as one would ask the reader to name a device their contacts know.
    expect(trace.commits).toEqual([
      [deviceLoadingTopic()],
      [deviceLoadFailedTopic()],
    ]);
  });

  it('leaves a name that has already been read alone', async () => {
    const read = vi.fn();

    const trace = await simulate(restoreDeviceSaga(), {
      reads: [[deviceStore, { status: 'ready', label: 'Studio' }]],
      calls: [[readDeviceName, read]],
    });

    // A second anchor re-runs this. Without the guard it would clobber a name
    // typed since the first read landed.
    expect(read).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });
});

describe('nameDeviceSaga', () => {
  it('names the device and writes it through', async () => {
    const save = vi.fn();

    const trace = await simulate(nameDeviceSaga('Studio'), {
      calls: [[saveDeviceName, save]],
    });

    expect(trace.commits).toEqual([[deviceNamedTopic('Studio')]]);
    expect(save).toHaveBeenCalledWith(expect.any(AbortSignal), 'Studio');
    expect(trace.result).toBe(true);
  });

  it('normalizes the name before it is written anywhere', async () => {
    const save = vi.fn();

    await simulate(nameDeviceSaga('  Kitchen iPad \n'), {
      calls: [[saveDeviceName, save]],
    });

    // This one is persisted, so what reaches disk has to be what the store
    // would settle on rather than whatever the field held.
    expect(save).toHaveBeenCalledWith(expect.any(AbortSignal), 'Kitchen iPad');
  });

  it('refuses a name that is only whitespace', async () => {
    const save = vi.fn();

    const trace = await simulate(nameDeviceSaga('   '), {
      calls: [[saveDeviceName, save]],
    });

    // A field holding two spaces looks filled in and isn't. Saving it would
    // leave the device worse off than unnamed: the fallback to its key prefix
    // stops working, and every peer is told it's called nothing at all.
    expect(save).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
    expect(trace.result).toBe(false);
  });
});
