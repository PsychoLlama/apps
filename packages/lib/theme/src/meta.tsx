/// <reference types="@dev/vite-plugin-inline-script/types" />
import {
  DEFAULT_THEME_ID,
  THEME_COLOR_META_ID,
  THEME_COLORS,
} from './constants';
import prelude from './prelude.ts?inline-script';

// For stamping `<html data-theme>` alongside `<ThemeMeta />`.
export { DEFAULT_THEME_ID };

const defaultColors = THEME_COLORS[DEFAULT_THEME_ID];

/**
 * Head tags that set up the page's appearance before first paint: the
 * viewport, browser-chrome colors, and the persisted theme. Render
 * inside the document `<head>`, on a page whose `<html>` carries
 * `data-theme={DEFAULT_THEME_ID}`.
 */
export const ThemeMeta = () => (
  <>
    {/* `interactive-widget=resizes-content` shrinks the layout viewport
        when the on-screen keyboard opens, not just the visual one.
        Without it a `position: fixed` surface still spans the full
        screen and centers itself against space the keyboard is covering
        — a centered `<Dialog>` can land behind it. Chromium honors this;
        iOS Safari still behaves as `resizes-visual`. */}
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content"
    />

    {/* Paired `theme-color` meta tags drive the browser-chrome color per
        OS scheme. SSG-seeded with the `DEFAULT_THEME_ID` variant's page
        background; the prelude swaps both `content` attributes to the
        active theme before paint via the `id` lookup, so they must
        render before it. */}
    <meta
      id={THEME_COLOR_META_ID.light}
      name="theme-color"
      media="(prefers-color-scheme: light)"
      content={defaultColors.light}
    />
    <meta
      id={THEME_COLOR_META_ID.dark}
      name="theme-color"
      media="(prefers-color-scheme: dark)"
      content={defaultColors.dark}
    />

    {/* Render-blocking and inlined (no extra fetch): restamps the
        `<html>` appearance attributes from the persisted preferences,
        falling through to the SSG defaults on missing/invalid storage or
        when JS is disabled. `prelude` is compiled at build time from our
        own source — not untrusted input. */}
    {/* eslint-disable-next-line solid/no-innerhtml */}
    <script innerHTML={prelude} />
  </>
);
