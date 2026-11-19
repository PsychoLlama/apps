import { defineContract } from '@lib/messaging/rpc';
import type { SendOptions } from '@lib/messaging/message-port';
import type { Engine } from '../engine/engine';

/**
 * What the page may ask this worker to do.
 *
 * Built from a live {@link Engine} so the contract and the implementation
 * are one value. The host imports {@link EngineApi} to type its calls.
 */
export const createEngineApi = (engine: Engine, exit: () => void) =>
  defineContract<SendOptions>()({
    requests: {
      /** Found a group called `name`, resolving with its id. */
      createGroup: (input: { name: string }): Promise<string> =>
        engine.createGroup(input.name),

      /** Share `body` to a group. */
      addItem: (input: { groupId: string; body: string }): Promise<void> =>
        engine.addItem(input.groupId, input.body),

      /** Delete an item from a group, for every device. */
      deleteItem: (input: { groupId: string; itemId: string }): Promise<void> =>
        engine.deleteItem(input.groupId, input.itemId),

      /** Share a file to a group. Resolves once it's all written here. */
      addFile: (input: {
        groupId: string;
        file: Blob;
        name: string;
        type: string;
      }): Promise<void> =>
        engine.addFile(input.groupId, input.file, input.name, input.type),

      /**
       * Read a whole file out of a group. Rejects if this device doesn't
       * hold all of it yet.
       */
      readFile: (input: {
        groupId: string;
        itemId: string;
        size: number;
      }): Promise<Blob> =>
        engine.readFile(input.groupId, input.itemId, input.size),

      /** Make an invitation to a group, resolving with its code. */
      invite: (input: { groupId: string }): string =>
        engine.invite(input.groupId),

      /**
       * Use another device's invitation, resolving with the group's id.
       * Rejects with the reason if the invitation didn't work.
       */
      join: (input: { code: string }): Promise<string> =>
        engine.join(input.code),
    },

    events: {
      /**
       * Claim the device and open it. An event, since the outcome arrives
       * as news: opening may wait on another tab indefinitely.
       */
      open: (): void => engine.open(),

      /**
       * Point the feed at a group, or at nothing. Its items arrive as
       * `feedChanged`, now and whenever they change.
       */
      watch: (input: { groupId: string | null }): void =>
        engine.watch(input.groupId),

      /** Take back an invitation that hasn't been used. */
      cancelInvite: (input: { code: string }): void =>
        engine.cancelInvite(input.code),

      /**
       * Close the device and end the worker. An event because the caller
       * is a synchronous teardown path with nowhere to put an answer.
       */
      close: (): void => void engine.close().finally(exit),
    },
  });

/** The worker's surface, derived from the implementation that serves it. */
export type EngineApi = ReturnType<typeof createEngineApi>;
