import { pipe } from '@lib/effects';
import type { DeviceConnection } from '../platform/device';
import { normalizeDeviceName, normalizeGroupName } from '../state';
import { $openDevice } from './device';

/**
 * Call this device something else, in every group it's in. Resolves
 * `false` if the name wasn't one.
 */
export const $renameDevice = pipe([
  $openDevice,
  (connection: DeviceConnection) =>
    async (name: string): Promise<boolean> => {
      const normalized = normalizeDeviceName(name);
      if (normalized === null) return false;

      await connection.renameDevice(normalized);
      return true;
    },
]);

/**
 * Call a group something else, for every device in it. Resolves `false`
 * if the name wasn't one.
 */
export const $renameGroup = pipe([
  $openDevice,
  (connection: DeviceConnection) =>
    async (groupId: string, name: string): Promise<boolean> => {
      const normalized = normalizeGroupName(name);
      if (!normalized) return false;

      await connection.renameGroup(groupId, normalized);
      return true;
    },
]);

/**
 * Ask a group to remove a device. It goes when the group agrees, which
 * takes most of its devices being reachable.
 */
export const $removeDevice = pipe([
  $openDevice,
  (connection: DeviceConnection) => (groupId: string, deviceId: string) =>
    connection.removeDevice(groupId, deviceId),
]);

/** Be done with a group. Resolves with its id once that's under way. */
export const $leaveGroup = pipe([
  $openDevice,
  (connection: DeviceConnection) =>
    async (groupId: string): Promise<string> => {
      await connection.leaveGroup(groupId);
      return groupId;
    },
]);

/**
 * Start a group over with only this device in it, resolving with the new
 * group's id.
 */
export const $replaceGroup = pipe([
  $openDevice,
  (connection: DeviceConnection) => (groupId: string) =>
    connection.replaceGroup(groupId),
]);
