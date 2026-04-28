import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { readdirSync } from 'node:fs';
import path from 'node:path';

// Eagerly resolve component-test paths so the storybookTest plugin can
// pick them up via `STORYBOOK_COMPONENT_PATHS` and merge them with the
// auto-discovered `*.stories.tsx` smoke tests.
const srcDir = path.join(import.meta.dirname, 'src');
const componentTestPaths = readdirSync(srcDir, { recursive: true })
  .filter(
    (entry): entry is string =>
      typeof entry === 'string' &&
      entry.includes(`${path.sep}__tests__${path.sep}`) &&
      /\.test\.tsx?$/.test(entry),
  )
  .map((entry) => path.join(srcDir, entry));
process.env.STORYBOOK_COMPONENT_PATHS = componentTestPaths.join(';');

export default defineConfig({
  test: {
    name: 'smoke',
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
    storybookTest({
      configDir: path.join(import.meta.dirname, '.storybook'),
    }),
  ],
});
