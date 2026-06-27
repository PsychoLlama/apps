import { start } from './start';

/**
 * The observability worker entry — a {@link SharedWorker} spawned on the main
 * thread by the OPFS log backend (see `../main/index.ts`). One instance is
 * shared by every tab on the origin; each tab connects over its own
 * `MessagePort`, streams its logs in as `log` events, and the worker persists
 * them — together with its own logs — into a single grow-only OPFS file.
 *
 * Booting the RPC endpoint is a load-time side effect, so `package.json` lists
 * this module under `sideEffects` to keep bundlers from tree-shaking it away.
 * The logic lives in `./start.ts`; this entry only wires connections to it.
 */

// Open the shared sink at boot and get a binder for incoming connections.
const connect = start();

// `SharedWorkerGlobalScope.onconnect` fires once per connecting tab, handing
// over the tab's `MessagePort` in `event.ports[0]`. The transport listens via
// `addEventListener`, which doesn't auto-start a port, so start it before
// binding. `self` is typed `DedicatedWorkerGlobalScope` under this file's
// `WebWorker` config (see `tsconfig.json`); reach the shared-scope `connect`
// event through a cast.
const scope = self as unknown as SharedWorkerGlobalScope;
scope.addEventListener('connect', (event) => {
  const [port] = event.ports;
  port.start();
  connect(port);
});
