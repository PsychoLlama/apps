import { defineConfig } from '@lib/runtime-config';

/**
 * Whether the logs export action is enabled. The export behavior has
 * landed, so it ships in every environment.
 */
export const logExport = defineConfig('@app/logs:export', {
  development: { enabled: true },
  staging: { enabled: true },
  production: { enabled: true },
});
