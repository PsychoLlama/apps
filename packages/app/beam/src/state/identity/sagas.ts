import { call, commit, defineSaga, read } from '@lib/state';
import { removeContact, saveContact } from '../platform/database';
import { encodeBeamCode } from '../platform/qr-code';
import { now } from '../platform/host';
import { beamScope } from '../scope';
import { deviceNamedTopic, identityStore } from './identity';
import { codeEncodedTopic } from './qr-code';

/**
 * Name this device, answering whether it took. An emptied name clears it,
 * dropping the device back to the prefix of its own key — the same fallback
 * an unnamed contact wears, so it's a name rather than a blank.
 *
 * Needs the key, so it can't run before one lands. In practice one always
 * has: the key is minted on load and this is driven by a button.
 *
 * A row left at an address this device no longer answers on is deleted rather
 * than left behind. The name follows the device, so a rotated key would
 * otherwise leave a second self row on disk — and the read that picks one of
 * them up would be picking arbitrarily.
 *
 * This is the half that has to survive a reload. Telling the peers already on
 * the line is the network's job — see `renameDeviceSaga`, which wraps this.
 */
export const nameDeviceSaga = defineSaga(
  beamScope,
  async function* (label: string | null) {
    const { endpointId, record } = yield* read(identityStore);
    if (!endpointId) return false;

    const previous = record?.endpointId;
    const at = yield* call(now);

    yield commit(deviceNamedTopic({ endpointId, label, at }));

    if (previous && previous !== endpointId) {
      yield* call(removeContact, previous);
    }

    // Read back rather than rebuilt: the fold decides what a name may be, so
    // what goes to disk has to be what the fold settled on. The spread copies
    // the store's view into a plain object — IndexedDB structured-clones what
    // it's handed, and a reactive proxy is not what we want on disk.
    const named = (yield* read(identityStore)).record;
    if (named) yield* call(saveContact, { ...named });

    return true;
  },
);

/**
 * Encode this device's beam link into a scannable grid.
 *
 * Spawned rather than awaited so it runs alongside the relay handshake: both
 * need the wasm, neither needs the other, and the invite is readable from the
 * link alone while the code is still being drawn.
 */
export const encodeInviteSaga = defineSaga(
  beamScope,
  async function* (endpointId: string) {
    const grid = yield* call(encodeBeamCode, endpointId);
    yield commit(codeEncodedTopic(grid));
  },
);
