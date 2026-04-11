import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    name: 'storybook',
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
      configDir: path.join(dirname, '.storybook'),
    }),
  ],
});
