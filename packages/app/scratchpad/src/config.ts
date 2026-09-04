import { defineConfig } from '@lib/runtime-config';

/**
 * Whether the scratchpad app is enabled. It's a branch-scoped
 * scratchpad, so it ships everywhere *except* production — available in
 * local dev and on preview deploys, hidden from the production build.
 */
export const enabled = defineConfig('@app/scratchpad', {
  development: { enabled: true },
  staging: { enabled: true },
  production: { enabled: false },
});
