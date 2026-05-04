/**
 * Side-effect entry that registers IBM Plex Sans Variable as a web font.
 *
 * The typography tokens in `tokens/typography.css.ts` reference this
 * family in their stack — import this module from the host so the
 * `@font-face` rules reach the browser.
 *
 * Imports the CSS file directly so the type checker sees the
 * `*.css` ambient declaration shipped by `vite/client`. The
 * fontsource package itself has no JS types.
 */
import '@fontsource-variable/ibm-plex-sans/index.css';
