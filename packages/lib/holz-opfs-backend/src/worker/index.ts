import { start } from './start';

/**
 * The observability worker entry. Spawned on the main thread by the OPFS log
 * backend (see `../main/index.ts`). It waits for the host's
 * `init` request, opens the named log file in the origin-private file system,
 * then hands back the writable end of a stream whose UTF-8 NDJSON chunks it
 * persists to that file.
 *
 * Booting the RPC endpoint is a load-time side effect, so `package.json` lists
 * this module under `sideEffects` to keep bundlers from tree-shaking it away.
 * The logic lives in `./start.ts`; this entry only triggers it.
 */

// This file is typed for the worker (see `tsconfig.json`), so `self` reads as a
// `DedicatedWorkerGlobalScope` and satisfies `MessageEndpoint` with no cast.
start(self);
