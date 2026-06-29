import { defineOption } from '@lib/runtime-config';

/**
 * Whether the experimental app is enabled. It's a branch-scoped
 * scratchpad, so it ships everywhere *except* production — available in
 * local dev and on preview deploys, hidden from the production build.
 */
export const experimentalApp = defineOption('experimental-app', {
  development: { enabled: true },
  staging: { enabled: true },
  production: { enabled: false },
});
