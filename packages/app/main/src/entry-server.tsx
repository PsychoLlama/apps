// @refresh reload
import { createHandler, StartServer } from '@solidjs/start/server';
import { Flex } from '@lib/ui';
import {
  DEFAULT_THEME_ID,
  THEME_COLOR_META_ID,
  THEME_COLORS,
} from '@lib/theme';
import themePrelude from 'virtual:theme-prelude';

const defaultColors = THEME_COLORS[DEFAULT_THEME_ID];

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en" data-theme={DEFAULT_THEME_ID}>
        <head>
          <meta charset="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
          />
          {/* Paired `theme-color` meta tags drive the browser-chrome
              color per OS scheme. SSG-seeded with the `DEFAULT_THEME_ID`
              variant's page background; the prelude (below) swaps both
              `content` attributes to the active theme before paint via
              the `id` lookup. Must render before the prelude so
              `getElementById` finds them. */}
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
          {/* PWA manifest. The file is emitted at a stable root path
              by the `pwa-manifest` Vite plugin (see `vite.config.ts`),
              not under `/_build/`, so the URL is hardcoded here rather
              than imported as a hashed asset. */}
          <link rel="manifest" href="/manifest.webmanifest" />
          {/* Render-blocking head script: restamps `data-theme` from
              the persisted preference before paint, falling through to
              the SSG-stamped `DEFAULT_THEME_ID` on missing/invalid
              storage or when JS is disabled. Inlined (no extra fetch)
              and compiled from `./theme-prelude.ts` so the typing
              story is intact end-to-end. `themePrelude` is a
              compile-time string produced by `inline-script` from our
              own source — not untrusted input. */}
          {/* eslint-disable-next-line solid/no-innerhtml */}
          <script innerHTML={themePrelude} />
          {assets}
        </head>
        <body>
          <Flex as="div" id="app" direction="column" grow>
            {children}
          </Flex>
          {scripts}
        </body>
      </html>
    )}
  />
));
