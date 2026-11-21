import { collect, pipe } from '@lib/effects';
import type { DeviceConnection } from '../platform/device';
import { openFileTab } from '../platform/open-file';
import { saveFile } from '../platform/save-file';
import {
  $groupViewed,
  FILE_NAME_MAX_LENGTH,
  normalizeBody,
  openableType,
} from '../state';
import { $openDevice } from './device';

/**
 * Found a group with this device as its only member, resolving with its
 * id. Nobody is asked for a name: a group starts without one, and can be
 * given one whenever someone cares to.
 */
export const $createGroup = pipe([
  $openDevice,
  (connection: DeviceConnection) => (): Promise<string> =>
    connection.createGroup(''),
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

/**
 * Share files to a group, one after another, in the order given. Resolves
 * once they're all written here.
 */
export const $shareFiles = pipe([
  $openDevice,
  (connection: DeviceConnection) =>
    async (groupId: string, files: readonly File[]): Promise<void> => {
      for (const file of files) {
        await connection.addFile(groupId, file);
      }
    },
]);

/**
 * Save a file from a group to this device's downloads, under the name it
 * was shared with.
 */
export const $saveFile = pipe([
  $openDevice,
  (connection: DeviceConnection) =>
    async (
      groupId: string,
      itemId: string,
      file: { name: string; size: number },
    ): Promise<void> => {
      const bytes = await connection.readFile(groupId, itemId, file.size);
      saveFile(bytes, file.name.slice(0, FILE_NAME_MAX_LENGTH) || 'file');
    },
]);

/**
 * Open a file from a group in a tab of its own, or save it if it isn't
 * one of the few types {@link openableType} says are safe to show.
 *
 * The tab is opened first and filled once the file is read: a browser
 * only opens one while the click that asked is fresh. If it won't open
 * one at all, the file is saved.
 */
export const $openFile = pipe([
  $openDevice,
  (connection: DeviceConnection) =>
    async (
      groupId: string,
      itemId: string,
      file: { name: string; size: number; type: string },
    ): Promise<void> => {
      const type = openableType(file);
      const tab = type === null ? null : openFileTab();

      try {
        const bytes = await connection.readFile(groupId, itemId, file.size);

        if (tab && type !== null) tab.show(new Blob([bytes], { type }));
        else
          saveFile(bytes, file.name.slice(0, FILE_NAME_MAX_LENGTH) || 'file');
      } catch (error) {
        tab?.close();
        throw error;
      }
    },
]);

/**
 * Read an image back out of a group to show it, resolving with an object
 * URL for it. Whoever asks owns the URL, and revokes it when done.
 *
 * Only for a file {@link isPreviewable} says is a picture: the bytes are
 * handed to the browser under the type the file claims.
 */
export const $previewFile = pipe([
  $openDevice,
  (connection: DeviceConnection) =>
    async (
      groupId: string,
      itemId: string,
      file: { size: number; type: string },
    ): Promise<string> => {
      const bytes = await connection.readFile(groupId, itemId, file.size);

      return URL.createObjectURL(new Blob([bytes], { type: file.type }));
    },
]);
