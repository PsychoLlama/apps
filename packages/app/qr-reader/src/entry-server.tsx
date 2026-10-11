// @refresh reload
import { createHandler, StartServer } from '@solidjs/start/server';
import { Flex } from '@lib/ui';
import { DEFAULT_THEME_ID, ThemeMeta } from '@lib/theme/meta';

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en" data-theme={DEFAULT_THEME_ID}>
        <head>
          <meta charset="utf-8" />
          <ThemeMeta />

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
