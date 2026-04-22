import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import path from 'node:path';

export default defineConfig({
  test: {
    name: 'smoke',
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
    storybookTest({
      configDir: path.join(import.meta.dirname, '.storybook'),
    }),
  ],
});
