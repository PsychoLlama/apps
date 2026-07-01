import { defineConfig } from '@lib/runtime-config';

/**
 * Whether the share app is enabled. It's a work in progress, so it ships
 * to local dev and preview (staging) for testing — hidden from production
 * builds until it's ready.
 */
export const enabled = defineConfig('@app/share', {
  development: { enabled: true },
  staging: { enabled: true },
  production: { enabled: false },
});
