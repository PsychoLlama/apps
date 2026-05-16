import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { instrumentationScope } from '@dev/build/vite-plugin/instrumentation-scope';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    browser: {
      enabled: true,
      provider: playwright({
        launchOptions: {
          executablePath: process.env.CHROMIUM_PATH,
        },
      }),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
  plugins: [
    instrumentationScope(),
    storybookTest({
      configDir: path.join(import.meta.dirname, '.storybook'),
    }),
  ],
});
