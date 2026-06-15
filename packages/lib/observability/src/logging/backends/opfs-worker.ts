import type { LogProcessor } from '@holz/core';
import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import ObservabilityWorker from '../../worker/index?worker';
import { createHostHandlers, type HostApi } from '../../host-api.ts';
import type { WorkerApi } from '../../worker/rpc.ts';

/**
 * A log backend that will ship logs to the observability worker for
 * off-main-thread persistence to OPFS. Spawns the worker eagerly — the moment
 * the backend is created — so it's warm before the first log arrives.
 *
 * Must be created on the browser main thread: only it can construct a
 * `Worker`, and spawning from inside a worker would loop. The pipeline links
 * this in behind `inMainThread` (see `../processor.browser.ts`), which is the
 * sole guard — calling it off the main thread is a wiring bug, not a runtime
 * input to defend against.
 */
export const createOpfsWorkerBackend = (): LogProcessor => {
  // `name` surfaces in DevTools' thread list and is readable inside the
  // worker as `self.name` — a stable label beats the anonymous default.
  const worker = new ObservabilityWorker({ name: 'Observability' });

  // Wire the host end of the worker RPC. `RPC.from` subscribes eagerly, so
  // doing it synchronously right after spawning attaches the listener before
  // the worker can post: the worker fires `ready` on boot, but that can't run
  // until its script loads (a later task), so the event can't be missed. The
  // endpoint is intentionally not retained — the transport's listener keeps it
  // reachable via `worker`, and the backend has no teardown.
  RPC.from<HostApi, WorkerApi, SendOptions>(
    new MessagePortTransport<RpcMessage, RpcMessage>(worker),
    createHostHandlers(),
  );

  return () => {
    // TODO: forward the log to `worker` for OPFS persistence. The worker has
    // no sink yet — and there's plenty to build before it does — so drop logs
    // for now. `void` keeps the handle alive until the forwarding lands.
    void worker;
  };
};
