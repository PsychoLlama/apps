import { defineScope } from '@lib/state-next';

/**
 * Owns everything a scanner session holds: the live camera stream, the
 * decoder worker, and the sagas driving them. `QrScanner` anchors it for the
 * lifetime of the page, so a camera session and the worker that serves it
 * share one lifetime.
 *
 * Releasing the last anchor is the whole teardown story: in-flight sagas
 * abort (including a request still waiting on its permission prompt), the
 * stream's tracks stop, and the worker is terminated — each by the drop hook
 * on the cell that holds it.
 */
export const scannerScope = defineScope();
