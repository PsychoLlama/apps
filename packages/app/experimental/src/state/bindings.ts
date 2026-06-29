import { defineAction, defineEffect } from '@lib/state';
import { createLogger, toError } from '@lib/observability';
import type { EnvironmentDefaults } from '@lib/runtime-config';
import { readExperimentalConfig } from '../capabilities';
import { CURRENT_ENVIRONMENT } from '../flag';
import { experimentalFlagStore } from './store';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/** Land the flag value resolved for the active environment. */
const applyConfig = defineAction(
  [experimentalFlagStore],
  (state, config: EnvironmentDefaults<{ enabled: boolean }>) => {
    state.enabled = config[CURRENT_ENVIRONMENT].enabled;
  },
);

/**
 * Record a failed read and keep the seeded default. The override read sits
 * over OPFS, which can surface unexpected errors; the gate stays on its
 * default rather than crash the route.
 */
const failConfig = defineAction(
  [experimentalFlagStore],
  (_state, error: Error) => {
    logger.error('Failed to read the experimental flag.', {
      error: toError(error),
    });
  },
);

/**
 * Refine the gate with any persisted runtime override. Client-only — OPFS
 * is unavailable during SSG, where the store already holds the default — so
 * perform it from `onMount`.
 */
export const loadExperimentalFlagEffect = defineEffect(
  [],
  readExperimentalConfig,
  {
    onSuccess: applyConfig,
    onFailure: failConfig,
  },
);
