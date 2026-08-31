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

/**
 * Whether the floating-UI scratchpad withholds the anchor from the
 * tether, leaving placement to CSS alone. Persisted so the pre-hydration
 * state — the one you're most often bouncing in and out of while working
 * on the CSS — survives the reload that gets you back to it.
 */
export const tetherDisabled = defineConfig<{ disabled: boolean }>(
  '@app/scratchpad:tether-disabled',
  {
    development: { disabled: false },
    staging: { disabled: false },
    production: { disabled: false },
  },
);
