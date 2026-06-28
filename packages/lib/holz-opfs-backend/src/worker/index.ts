import WriterWorker from './writer?worker';
import { startHub } from './hub';

/**
 * The observability worker entry — a {@link SharedWorker} spawned on the main
 * thread by the OPFS log backend (see `../main/index.ts`). One instance is
 * shared by every tab on the origin; each tab connects over its own
 * `MessagePort` and streams its logs in as `log` events.
 *
 * The hub can't persist them itself: `createSyncAccessHandle` is exposed only
 * in a `DedicatedWorker`, not a `SharedWorker`. So it spawns a nested dedicated
 * writer worker that owns the single OPFS file, and acts as the fan-in relay —
 * forwarding every tab's logs, plus its own, into that one writer.
 *
 * Booting is a load-time side effect, so `package.json` lists this module under
 * `sideEffects` to keep bundlers from tree-shaking it away. The logic lives in
 * `./hub.ts`; this entry spawns the writer and wires connections to it.
 */

// Spawn the dedicated writer and boot the hub against it. The writer is the
// realm that actually holds the OPFS handle (see `./writer.ts`); the hub's name
// is irrelevant to it, so it's left a plain DevTools label.
const writer = new WriterWorker({ name: 'Observability Writer' });
const connect = startHub(writer);

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
