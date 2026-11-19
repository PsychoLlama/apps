import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import { createLogger, toError } from '@lib/observability';
import { createHostHandlers, type HostApi } from '../host-api';
import type { EngineEvents } from '../engine/engine';
import type { EngineApi } from '../worker/rpc';
import DeviceWorker from '../worker/index?worker';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/** The page's hold on the device worker. */
export interface DeviceConnection {
  /** Found a group called `name`, resolving with its id. */
  createGroup(name: string): Promise<string>;

  /** Share `body` to a group. */
  addItem(groupId: string, body: string): Promise<void>;

  /** Delete an item from a group, for every device. */
  deleteItem(groupId: string, itemId: string): Promise<void>;

  /** Call this device something else, in every group it's in. */
  renameDevice(name: string): Promise<void>;

  /** Call a group something else, for every device in it. */
  renameGroup(groupId: string, name: string): Promise<void>;

  /** Ask a group to remove a device. */
  removeDevice(groupId: string, deviceId: string): Promise<void>;

  /** Be done with a group. */
  leaveGroup(groupId: string): Promise<void>;

  /**
   * Start a group over with only this device in it, resolving with the
   * new group's id.
   */
  replaceGroup(groupId: string): Promise<string>;

  /**
   * Share a file to a group. Resolves once it's all written here. The
   * file is handed over by reference; the worker reads it.
   */
  addFile(groupId: string, file: File): Promise<void>;

  /**
   * Read a whole file out of a group. Rejects if this device doesn't hold
   * all of it yet.
   */
  readFile(groupId: string, itemId: string, size: number): Promise<Blob>;

  /** Make an invitation to a group, resolving with its code. */
  invite(groupId: string): Promise<string>;

  /** Take back an invitation that hasn't been used. */
  cancelInvite(code: string): void;

  /**
   * Use another device's invitation, resolving with the group's id.
   * Rejects with the reason if the invitation didn't work.
   */
  join(code: string): Promise<string>;

  /**
   * Point the feed at a group, or at nothing. Its items arrive on the
   * feed's `feedChanged`, now and whenever they change.
   */
  watch(groupId: string | null): void;

  /**
   * Close the device and let the worker end. The worker leaves the network
   * and releases the store on its own time; a successor queues behind it.
   */
  release(): void;
}

/**
 * Spawn the device worker and ask it to open the device, reporting how
 * that goes to `feed`.
 *
 * A thread that dies can't say so, so its death is reported here on its
 * behalf, as a failed open.
 */
export const connectDevice = (feed: EngineEvents): DeviceConnection => {
  const worker = new DeviceWorker({ name: '@app/beam' });

  const rpc = RPC.from<HostApi, EngineApi, SendOptions>(
    new MessagePortTransport<RpcMessage, RpcMessage>(worker),
    createHostHandlers(feed),
  );

  worker.addEventListener('error', (event) => {
    const error = toError(event.error ?? event.message);

    logger.error('The device worker threw and stopped.', {
      error,
      filename: event.filename,
      lineno: event.lineno,
    });

    feed.openFailed({ reason: error.message });
  });

  // Posted before the worker has evaluated. The port queues it.
  void rpc.notify('open').catch((error: unknown) => {
    const failure = toError(error);
    logger.error('Could not reach the device worker.', { error: failure });
    feed.openFailed({ reason: failure.message });
  });

  return {
    createGroup: (name) => rpc.request('createGroup', { name }),
    addItem: (groupId, body) => rpc.request('addItem', { groupId, body }),
    deleteItem: (groupId, itemId) =>
      rpc.request('deleteItem', { groupId, itemId }),

    renameDevice: (name) => rpc.request('renameDevice', { name }),
    renameGroup: (groupId, name) =>
      rpc.request('renameGroup', { groupId, name }),
    removeDevice: (groupId, deviceId) =>
      rpc.request('removeDevice', { groupId, deviceId }),
    leaveGroup: (groupId) => rpc.request('leaveGroup', { groupId }),
    replaceGroup: (groupId) => rpc.request('replaceGroup', { groupId }),

    addFile: (groupId, file) =>
      rpc.request('addFile', {
        groupId,
        file,
        name: file.name,
        type: file.type,
      }),
    readFile: (groupId, itemId, size) =>
      rpc.request('readFile', { groupId, itemId, size }),

    invite: (groupId) => rpc.request('invite', { groupId }),
    join: (code) => rpc.request('join', { code }),

    cancelInvite(code) {
      void rpc.notify('cancelInvite', { code }).catch((error: unknown) => {
        logger.warn('Could not reach the device worker.', {
          error: toError(error),
        });
      });
    },

    watch(groupId) {
      void rpc.notify('watch', { groupId }).catch((error: unknown) => {
        logger.warn('Could not reach the device worker.', {
          error: toError(error),
        });
      });
    },

    release() {
      // The worker ends itself once the device has closed. Terminating it
      // from here would cut the close short, and peers would wait out a
      // timeout instead of seeing this device go.
      void rpc
        .notify('close')
        .catch(() => worker.terminate())
        .finally(() => rpc.close());
    },
  };
};
