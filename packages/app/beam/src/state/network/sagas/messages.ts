import { call, defineSaga, read } from '@lib/state';
import { sendMessage } from '../../platform/iroh';
import { helloMessage } from '../../../protocol';
import type { BeamMessage } from '../../../protocol';
import { noteAdvertisedNameSaga } from '../../contacts';
import { deviceNameFormula, nameDeviceSaga } from '../../identity';
import { beamScope } from '../../scope';
import { peerHandlesCell } from '../peers';
import { receiveShareSaga } from './shares';

/**
 * What a peer is allowed to change by saying so, and what this device says
 * back.
 *
 * Nothing here decides whether to talk to a peer — reaching this device means
 * holding its endpoint id, and that is the whole of the admission check.
 * What's left is a question of belief rather than access: an advertised name
 * is a suggestion the address book keeps apart from the local one, so a peer
 * can say what it likes without overwriting anything the reader typed.
 */

/**
 * Act on one message from a peer. This is the whole of what a peer is able to
 * say to us.
 *
 * The share branch is deliberately somewhere else: taking one is about the
 * log, and the log is what owns it.
 */
export const applyPeerMessageSaga = defineSaga(
  beamScope,
  async function* (input: { endpointId: string; message: BeamMessage }) {
    switch (input.message.type) {
      case 'hello':
        yield* noteAdvertisedNameSaga({
          endpointId: input.endpointId,
          label: input.message.label,
        });
        break;

      case 'share':
        yield* receiveShareSaga({
          endpointId: input.endpointId,
          body: input.message.body,
        });
        break;
    }
  },
);

/**
 * Rename this device and tell whoever is listening, answering whether the
 * rename took.
 *
 * The greeting `linkPeerSaga` sends is the only time a peer hears what this
 * device is called, so a rename that stopped at disk would leave every device
 * already on the line calling this one by a name it no longer answers to —
 * until it happened to reconnect, which may be days. Re-greeting is the
 * cheapest fix: `hello` is idempotent on the far side, where it lands as the
 * advertised name and never overwrites a nickname the reader chose.
 *
 * It's here rather than in `state/identity` because the peers are here. That
 * module owns what this device is called; this one owns who has been told.
 *
 * Absent peers are not chased. They hear it on the next link.
 */
export const renameDeviceSaga = defineSaga(
  beamScope,
  async function* (label: string | null) {
    const renamed = yield* nameDeviceSaga(label);
    if (!renamed) return false;

    // Read back rather than reused: a cleared name falls back to the key
    // prefix, and that fallback is what peers should be told.
    const announced = yield* read(deviceNameFormula);
    if (!announced) return true;

    const handles = yield* read(peerHandlesCell);
    for (const link of handles.values()) {
      yield* call(sendMessage, link, helloMessage(announced));
    }

    return true;
  },
);
