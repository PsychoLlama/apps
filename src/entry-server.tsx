// @refresh reload
import { createHandler, StartServer } from '@solidjs/start/server';
import { Flex } from '#ui';

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
{assets}
        </head>
        <body>
          <Flex as="div" id="app" direction="column" grow>{children}</Flex>
          {scripts}
        </body>
      </html>
    )}
  />
));
