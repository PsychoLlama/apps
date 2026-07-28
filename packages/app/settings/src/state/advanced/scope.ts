import { defineScope } from '@lib/state';

/**
 * Owns the live view of the Advanced section's runtime-config options and
 * the subscription feeding it. `AdvancedSettings` anchors it while the
 * section is on screen; releasing the last anchor tears the subscription
 * down.
 *
 * Nothing durable dies with it. OPFS holds the overrides, and the store is
 * a mirror re-read on mount.
 */
export const advancedSettingsScope = defineScope();
