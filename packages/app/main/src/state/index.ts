/**
 * The launcher's state: which gated apps surface on the suite's front
 * door.
 *
 * `@lib/runtime-config` owns the durable copy in OPFS and fans changes out
 * to every browsing context. `trackLauncherFlagsSaga` subscribes to that
 * fan-out, which makes it the store's only writer — the launcher never
 * writes a flag itself, it only reflects what the settings page persisted.
 */
export { launcherFlagsStore } from './flags';
export { launcherScope } from './scope';
export { trackLauncherFlagsSaga } from './sagas';
