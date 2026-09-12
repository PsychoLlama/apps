import { defineConfig } from '@lib/runtime-config';

/**
 * Whether the floating-UI scratchpad hands the anchor to the tether.
 * Unchecking it stands the tether down, leaving placement to CSS alone.
 * Persisted so the pre-hydration state — the one you're most often
 * bouncing in and out of while working on the CSS — survives the reload
 * that gets you back to it.
 */
export const tetherEnabled = defineConfig<{ enabled: boolean }>(
  '@app/scratchpad:tether-enabled',
  {
    development: { enabled: true },
    staging: { enabled: true },
    production: { enabled: true },
  },
);
