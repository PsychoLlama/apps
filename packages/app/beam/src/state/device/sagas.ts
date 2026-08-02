import { call, commit, defineSaga, read } from '@lib/state';
import {
  deviceLoadFailedTopic,
  deviceLoadingTopic,
  deviceNamedTopic,
  deviceRestoredTopic,
  deviceStore,
} from './device';
import { readDeviceName, saveDeviceName } from './capabilities';
import { normalizeLabel } from '../labels';
import { beamScope } from '../scope';

/**
 * Load this device's name into memory. `BeamLayout` runs it once as the
 * surface mounts — IndexedDB is client-only, so it can't run during SSG.
 *
 * Guarded on `initial` so a second anchor can't re-read the name and clobber
 * one typed since the first read landed.
 */
export const restoreDeviceSaga = defineSaga(beamScope, async function* () {
  const { status } = yield* read(deviceStore);
  if (status !== 'initial') return;

  yield commit(deviceLoadingTopic());

  try {
    const label = yield* call(readDeviceName);
    yield commit(deviceRestoredTopic(label));
  } catch {
    // Reported by the capability, which has the context to describe it.
    yield commit(deviceLoadFailedTopic());
  }
});

/**
 * Name this device, answering whether it took. The name is normalized here,
 * before it goes anywhere, because it's *written to disk* — what's stored has
 * to be the same string the fold settles on rather than whatever the field
 * held.
 *
 * A blank name is refused rather than saved as one. Nothing that normalizes
 * to a name means nothing to save, and a device carrying an empty string is
 * worse off than one carrying `null`: the fallback to its key prefix stops
 * working, and every peer is told it's called nothing at all.
 *
 * The answer is for the caller's benefit — setting a device up moves on only
 * once this lands, and a refused name shouldn't move anything.
 */
export const nameDeviceSaga = defineSaga(
  beamScope,
  async function* (raw: string) {
    const label = normalizeLabel(raw);
    if (!label) return false;

    yield commit(deviceNamedTopic(label));
    yield* call(saveDeviceName, label);
    return true;
  },
);
