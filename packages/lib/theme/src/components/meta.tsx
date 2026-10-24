import { Meta, useHead } from '@solidjs/meta';
import { createEffect, createUniqueId } from 'solid-js';
import { useClientResource } from '@lib/effects/solid';
import { $appearance } from '../behavior/appearance';
import { $theme } from '../behavior/theme';
import {
  type ColorSchemeId,
  DEFAULT_THEME_ID,
  THEME_COLOR_META_ID,
  THEME_COLORS,
} from '../constants';
import prelude from '../prelude.ts?inline-script';

// For stamping `<html data-theme>` alongside `<ThemeMeta />`.
export { DEFAULT_THEME_ID };

const defaultColors = THEME_COLORS[DEFAULT_THEME_ID];

/**
 * Head tags that set up the page's appearance before first paint: the
 * viewport, browser-chrome colors, and the persisted theme. Render under
 * the app's `<MetaProvider>`, on a page whose `<html>` carries
 * `data-theme={DEFAULT_THEME_ID}`.
 */
export const ThemeMeta = () => {
  // Unresolved until mount, so pre-rendering keeps the defaults.
  const theme = useClientResource($theme);
  const appearance = useClientResource($appearance);

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
      {/* `interactive-widget=resizes-content` shrinks the layout viewport
          when the on-screen keyboard opens, not just the visual one.
          Without it a `position: fixed` surface still spans the full
          screen and centers itself against space the keyboard is
          covering — a centered `<Dialog>` can land behind it. Chromium
          honors this; iOS Safari still behaves as `resizes-visual`. */}
      <Meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content"
      />

      {/* Paired `theme-color` meta tags drive the browser-chrome color
          per OS scheme. SSG-seeded with the `DEFAULT_THEME_ID` variant's
          page background; the prelude swaps both to the persisted theme
          before paint via the `id` lookup, then they follow the theme and
          appearance once mounted. */}
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

      <Prelude />
    </>
  );
};

/**
 * Render-blocking and inlined (no extra fetch): restamps the `<html>`
 * preference attributes from their persisted values, falling through to
 * the SSG defaults on missing/invalid storage or when JS is disabled.
 *
 * `@solidjs/meta` has no `<Script>`, so this goes through `useHead`. Its
 * tags land in order, so the prelude follows the theme-color tags it
 * swaps. They land after any stylesheets ahead of them, which the
 * script then waits on, but those block first paint anyway.
 */
const Prelude = () => {
  useHead({
    tag: 'script',
    // Compiled at build time from our own source — not untrusted input.
    props: { children: prelude },
    // Escaping would mangle the source.
    setting: { close: true, escape: false },
    id: createUniqueId(),
  });

  return null;
};
