/**
 * The condition gating the logs header's export action: whether a service
 * worker controls the page to answer the download. It's client-only, read on
 * mount by a saga that then follows every later handoff.
 */
export { exportAvailableFormula } from './gate';
export { trackExportGateSaga } from './sagas';
