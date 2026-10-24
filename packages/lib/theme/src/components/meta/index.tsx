import { Meta } from '@solidjs/meta';
import { DEFAULT_THEME_ID } from '../../constants';
import { Appearance } from './appearance';
import { Prelude } from './prelude';

// For stamping `<html data-theme>` alongside `<ThemeMeta />`.
export { DEFAULT_THEME_ID };

/**
 * Head tags that set up the page's appearance before first paint: the
 * viewport, browser-chrome colors, and the persisted theme. Render under
 * the app's `<MetaProvider>`, on a page whose `<html>` carries
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
    <Meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content"
    />

    <Appearance />

    {/* After `<Appearance>`: it swaps those tags by `id`. */}
    <Prelude />
  </>
);
