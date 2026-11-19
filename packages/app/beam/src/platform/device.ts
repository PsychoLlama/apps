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
