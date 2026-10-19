import { defineScope } from '@lib/state';

/**
 * Owns the Advanced section's write sagas and Log storage UI state.
 * `AdvancedSettings` anchors it while the section is on screen.
 *
 * Nothing durable dies with it. OPFS holds the overrides.
 */
export const advancedSettingsScope = defineScope();
