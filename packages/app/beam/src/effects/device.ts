import { collect, resource } from '@lib/effects';
import { connectDevice } from '../platform/device';
import {
  $deviceFailed,
  $deviceHeldElsewhere,
  $deviceOpened,
  $feedChanged,
  $groupsChanged,
  $membersChanged,
  $relayChanged,
} from '../state';

/**
 * This device, open for as long as the plan is held: the worker, the
 * database in it, and its place on the network. What happens to it lands on
 * `$device`, and what it holds on `$groups` and `$feed`.
 *
 * Releasing it closes the device and ends the worker.
 *
 * Client-only, so the page holds it from mount.
 */
export const $openDevice = collect(
  [
    $deviceOpened,
    $deviceHeldElsewhere,
    $deviceFailed,
    $relayChanged,
    $groupsChanged,
    $feedChanged,
    $membersChanged,
  ],
  (
    opened,
    heldElsewhere,
    failed,
    relayChanged,
    groupsChanged,
    feedChanged,
    membersChanged,
  ) => {
    const connection = connectDevice({
      opened: ({ deviceId }) => opened(deviceId),
      heldElsewhere: () => heldElsewhere(),
      openFailed: () => failed(),
      relayChanged: ({ homeRelay }) => relayChanged(homeRelay),
      groupsChanged: ({ groups }) => groupsChanged(groups),
      feedChanged: ({ groupId, items }) => feedChanged(groupId, items),
      membersChanged: ({ groupId, members }) =>
        membersChanged(groupId, members),
    });

    return resource(connection, () => connection.release());
  },
);
