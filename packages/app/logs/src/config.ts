import { defineConfig } from '@lib/runtime-config';

/**
 * Whether the logs export action is enabled. The feature is still being
 * built, so it ships only in local dev — hidden from staging and
 * production until the export behavior lands.
 */
export const logExport = defineConfig('@app/logs:export', {
  development: { enabled: true },
  staging: { enabled: false },
  production: { enabled: false },
});
