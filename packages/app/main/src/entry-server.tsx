// @refresh reload
/// <reference types="@dev/vite-plugin-pwa/types" />
import { createHandler, StartServer } from '@solidjs/start/server';
import { Flex } from '@lib/ui';
import { DEFAULT_THEME_ID, ThemeMeta } from '@lib/theme/meta';
import manifestUrl from 'virtual:pwa-manifest';

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en" data-theme={DEFAULT_THEME_ID}>
        <head>
          <meta charset="utf-8" />

          <ThemeMeta />

          {/* Stable, revalidating URL — see `@dev/vite-plugin-pwa`. */}
          <link rel="manifest" href={manifestUrl} />

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
