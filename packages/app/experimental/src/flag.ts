import { defineOption } from '@lib/runtime-config';
import type { Environment } from '@lib/runtime-config';

/**
 * Runtime flag gating the experimental scratchpad. Enabled in dev and
 * staging, hidden in production.
 *
 * Replaces the old build-time `INCLUDE_EXPERIMENTAL_APP` constant: the
 * `/experimental` route is now SSG'd unconditionally and consults this at
 * hydration to decide whether to render the app or a 404.
 */
export const experimentalOption = defineOption('experimental-app', {
  dev: { enabled: true },
  staging: { enabled: true },
  prod: { enabled: false },
});

/**
 * The environment this build runs as. Every per-environment lookup resolves
 * against it, so wiring real detection here flips the whole app at once.
 *
 * Placeholder until environment detection lands (followup). Pinned to `dev`
 * for now, which keeps the scratchpad reachable everywhere — production
 * hiding only takes effect once detection can report `prod`.
 */
export const CURRENT_ENVIRONMENT: Environment = 'dev';
