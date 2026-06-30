import { defineConfig } from '@lib/runtime-config';

/**
 * Whether the share app is enabled. It's an early-stage work in
 * progress, so it ships to local dev only — hidden from both preview
 * (staging) and production builds until it's ready.
 */
export const enabled = defineConfig('@app/share', {
  development: { enabled: true },
  staging: { enabled: false },
  production: { enabled: false },
});
