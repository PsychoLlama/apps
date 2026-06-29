// The package's public surface — IndexedDB persistence for holz logs, shared
// across the main thread, workers, and service workers.
export { createIdbBackend } from './holz-idb-backend';
export type { CreateIdbBackendOptions } from './holz-idb-backend';
