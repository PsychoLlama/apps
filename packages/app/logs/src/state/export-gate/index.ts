/**
 * The two conditions gating the logs header's export action: the
 * per-environment feature flag persisted by `@lib/runtime-config`, and whether
 * a service worker controls the page to answer the download. Both are
 * client-only and read together on mount, so one saga reconciles them into a
 * single reactive flush and then follows each one's changes.
 */
export { exportAvailableFormula } from './gate';
export { trackExportGateSaga } from './sagas';
