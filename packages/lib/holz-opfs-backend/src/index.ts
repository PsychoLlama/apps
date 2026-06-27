// The package's main-thread surface — everything the logging host wires up
// and everything a log viewer reads. The worker entry is the one piece that
// lives elsewhere: it's spawned, not imported, so it has its own `./worker`
// subpath (see `./main/index.ts`, which `?worker`-imports it).
export { createOpfsWorkerBackend } from './main/index';
export { subscribeLogFiles, type LogFileCreated } from './main/log-file-feed';
export { inMainThread, inObservabilityWorker } from './environment';
export { getWorkerLogBuffer } from './worker/worker-log-buffer';
export type { LogLocation } from './worker/rpc';
