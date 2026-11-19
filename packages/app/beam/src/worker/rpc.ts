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
    events: {
      /**
       * Claim the device and open it. An event, since the outcome arrives
       * as news: opening may wait on another tab indefinitely.
       */
      open: (): void => engine.open(),

      /**
       * Close the device and end the worker. An event because the caller
       * is a synchronous teardown path with nowhere to put an answer.
       */
      close: (): void => void engine.close().finally(exit),
    },
  });

/** The worker's surface, derived from the implementation that serves it. */
export type EngineApi = ReturnType<typeof createEngineApi>;
