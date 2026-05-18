// @refresh reload
import { createHandler, StartServer } from '@solidjs/start/server';
import { Flex } from '@lib/ui';
import { DEFAULT_THEME_ID } from '@lib/theme';
import themePrelude from 'virtual:theme-prelude';

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
