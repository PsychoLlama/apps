import { defineScope } from '@lib/state';

/**
 * Owns the Log storage controls' UI state and delete saga. `LogStorage`
 * anchors it while it's on screen.
 */
export const advancedSettingsScope = defineScope();
