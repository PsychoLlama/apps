// @refresh reload
import { createHandler, StartServer } from '@solidjs/start/server';
import * as css from './app.css';

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
          <div id="app" class={css.shell}>{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
