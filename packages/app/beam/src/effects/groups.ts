import { collect, pipe } from '@lib/effects';
import type { DeviceConnection } from '../platform/device';
import { $groupViewed, normalizeBody, normalizeGroupName } from '../state';
import { $openDevice } from './device';

/**
 * Found a group with this device as its only member, resolving with its id,
 * or `null` if the name wasn't one.
 */
export const $createGroup = pipe([
  $openDevice,
  (connection: DeviceConnection) =>
    async (name: string): Promise<string | null> => {
      const normalized = normalizeGroupName(name);
      return normalized ? connection.createGroup(normalized) : null;
    },
]);

/**
 * Turn the feed to a group, or away from all of them. The feed empties at
 * once and fills when the database answers.
 */
export const $viewGroup = collect(
  [$openDevice, $groupViewed],
  (connection, groupViewed) => (groupId: string | null) => {
    groupViewed(groupId);
    connection.watch(groupId);
  },
);

/**
 * Share a note or a link to a group. Resolves `true` once it's written
 * here, `false` if there was nothing worth sharing.
 */
export const $shareItem = pipe([
  $openDevice,
  (connection: DeviceConnection) =>
    async (groupId: string, body: string): Promise<boolean> => {
      const normalized = normalizeBody(body);
      if (!normalized) return false;

      await connection.addItem(groupId, normalized);
      return true;
    },
]);

/** Delete an item from a group, for every device in it. */
export const $deleteItem = pipe([
  $openDevice,
  (connection: DeviceConnection) => (groupId: string, itemId: string) =>
    connection.deleteItem(groupId, itemId),
]);
