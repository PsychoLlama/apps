import { defineScope } from '@lib/state-next';

/**
 * Owns everything the log viewer holds: the archive snapshot, the IndexedDB
 * connection it reads through, the two conditions gating the export action,
 * and the sagas feeding them. The views anchor it while a `/logs/*` page is on
 * screen; releasing the last anchor aborts those sagas, drops the insert and
 * config subscriptions, and closes the connection.
 *
 * Nothing durable dies with it. IndexedDB holds the logs and OPFS the export
 * override — the stores are mirrors, re-read on mount.
 */
export const logsScope = defineScope();
