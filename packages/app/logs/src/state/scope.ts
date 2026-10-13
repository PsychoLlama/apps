import { defineScope } from '@lib/state';

/**
 * Owns everything the log viewer holds: the archive snapshot, the IndexedDB
 * connection it reads through, and the sagas feeding them. The views anchor it
 * while a `/logs/*` page is on screen; releasing the last anchor aborts those
 * sagas, drops the insert subscription, and closes the connection.
 *
 * Nothing durable dies with it. IndexedDB holds the logs — the store is a
 * mirror, re-read on mount.
 */
export const logsScope = defineScope();
