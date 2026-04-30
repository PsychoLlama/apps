// @refresh reload
import { createHandler, StartServer } from '@solidjs/start/server';
import { Flex } from '@lib/ui';

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
          />
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
