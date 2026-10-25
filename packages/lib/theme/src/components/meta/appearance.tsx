import { Meta } from '@solidjs/meta';
import { createEffect } from 'solid-js';
import { useClientValue } from '@lib/effects/solid';
import { $appearance } from '../../behavior/appearance';
import { $theme } from '../../behavior/theme';
import {
  type ColorSchemeId,
  DEFAULT_THEME_ID,
  THEME_COLOR_META_ID,
  THEME_COLORS,
} from '../../constants';

const defaultColors = THEME_COLORS[DEFAULT_THEME_ID];

/**
 * Paired `theme-color` meta tags drive the browser-chrome color per OS
 * scheme. SSG-seeded with the `DEFAULT_THEME_ID` variant's page
 * background; the prelude swaps both to the persisted theme before paint
 * via the `id` lookup, then they follow the theme and appearance once
 * mounted.
 */
export const Appearance = () => {
  // Undefined until mount, so pre-rendering keeps the defaults.
  const theme = useClientValue($theme);
  const appearance = useClientValue($appearance);

  // Keep one tag on the theme's page background for its scheme. A forced
  // appearance collapses both tags onto its color; otherwise each tag's
  // `prefers-color-scheme` media query would pick the wrong one. Until
  // both resolve, the prelude's colors stand.
  //
  // Written to the element, not through props: `@solidjs/meta` (0.29.4)
  // files tags under a key that includes `content`, re-derives it on
  // removal, and loses track of a tag whose `content` changes.
  const followTheme = (scheme: ColorSchemeId) => (tag: HTMLMetaElement) => {
    createEffect(() => {
      const current = theme();
      const forced = appearance();
      if (current === undefined || forced === undefined) return;

      const colors = THEME_COLORS[current];
      tag.setAttribute(
        'content',
        colors[forced === 'system' ? scheme : forced],
      );
    });
  };

  return (
    <>
      <Meta
        ref={followTheme('light')}
        id={THEME_COLOR_META_ID.light}
        name="theme-color"
        media="(prefers-color-scheme: light)"
        content={defaultColors.light}
      />
      <Meta
        ref={followTheme('dark')}
        id={THEME_COLOR_META_ID.dark}
        name="theme-color"
        media="(prefers-color-scheme: dark)"
        content={defaultColors.dark}
      />
    </>
  );
};
