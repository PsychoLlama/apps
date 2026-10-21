import { collect } from '@lib/effects';
import { sendMessage } from '../platform/iroh';
import { helloMessage, type BeamMessage } from '../protocol';
import { $identity, $peerHandles, deviceNameOf } from '../state';
import { $noteAdvertisedName } from './contacts';
import { $nameDevice } from './identity';
import { $receiveShare } from './shares';

/**
 * Act on one message from a peer. This is the whole of what a peer is able to
 * say to us. An advertised name is a suggestion the address book keeps apart
 * from the local one, so a peer can say what it likes without overwriting
 * anything the reader typed.
 */
export const $applyPeerMessage = collect(
  [$noteAdvertisedName, $receiveShare],
  (noteAdvertisedName, receiveShare) =>
    async (endpointId: string, message: BeamMessage) => {
      switch (message.type) {
        case 'hello':
          await noteAdvertisedName(endpointId, message.label);
          break;

        case 'share':
          receiveShare(endpointId, message.body);
          break;
      }
    },
);

/**
 * Rename this device and tell whoever is listening.
 *
 * The greeting a new link sends is the only time a peer hears what this
 * device is called, so a rename that stopped at disk would leave every device
 * already on the line calling this one by a name it no longer answers to.
 * Re-greeting is the cheapest fix: `hello` is idempotent on the far side.
 * Absent peers hear it on the next link.
 */
export const $renameDevice = collect(
  [$nameDevice, $identity, $peerHandles],
  (nameDevice, self, handles) => async (label: string | null) => {
    if (!(await nameDevice(label))) return;

    // Read back rather than reused: a cleared name falls back to the key
    // prefix, and that fallback is what peers should be told.
    const announced = deviceNameOf(self);
    if (!announced) return;

    for (const link of handles().values()) {
      await sendMessage(link, helloMessage(announced));
    }
  },
);
