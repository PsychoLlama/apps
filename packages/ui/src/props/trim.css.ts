/**
 * Leading-trim polyfill using pseudo-elements with negative margins.
 * Technique from Radix UI Themes: https://github.com/radix-ui/themes (MIT)
 *
 * The start trim uses the `cap` CSS unit (Baseline 2023) so it adapts
 * automatically to font changes. The baseline offset — the only
 * hardcoded constant — is co-located with the font definition in
 * #design/tokens/typography.css.ts.
 *
 * Native replacement (limited availability):
 * https://developer.mozilla.org/en-US/docs/Web/CSS/text-box-trim
 */
import { styleVariants } from '@vanilla-extract/css';
import { baselineOffset } from '@psychollama/design';

const trimStart = `calc(1cap - ${baselineOffset} - 0.5lh)`;
const trimEnd = `calc(${baselineOffset} - 0.5lh)`;

export const trim = styleVariants({
  start: {
    '::before': {
      content: '""',
      display: 'table',
      marginBottom: trimStart,
    },
  },
  end: {
    '::after': {
      content: '""',
      display: 'table',
      marginTop: trimEnd,
    },
  },
  both: {
    '::before': {
      content: '""',
      display: 'table',
      marginBottom: trimStart,
    },
    '::after': {
      content: '""',
      display: 'table',
      marginTop: trimEnd,
    },
  },
});
