/**
 * Vite resolves this file by walking up from each app's project root,
 * so a single entry covers `@app/main`, Storybook, and any other Vite
 * pipeline in the workspace.
 *
 * The Panda PostCSS plugin finds the `@layer reset, base, tokens,
 * recipes, utilities;` declaration in `@lib/styled-system/styles.css`
 * and fills the layers with content extracted from `css()`/`cva()`
 * call sites scanned per `panda.config.ts`.
 */
export default {
  plugins: {
    '@pandacss/dev/postcss': {},
  },
};
