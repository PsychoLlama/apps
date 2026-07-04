import { Match, Switch } from 'solid-js';
import IconConnecting from 'virtual:icons/mdi/loading';
import IconConnected from 'virtual:icons/mdi/check-circle-outline';
import IconFailed from 'virtual:icons/mdi/alert-circle-outline';
import { connection } from '../state/session';
import * as css from './connection-indicator.css';

/**
 * Relay-connection status for the header's actions tray. A spinning glyph
 * while the endpoint joins the network, resolving to a check once it's live
 * or an alert if the connect errors. The idle `initial` state renders nothing
 * — there's no reconnect affordance yet, so the tray simply stays empty until
 * a connect is underway.
 *
 * The `<output>` is an implicit `status` live region, and each glyph carries
 * its own `aria-label`, so swapping one in announces the new state to
 * assistive tech.
 */
export const ConnectionIndicator = () => (
  <output class={css.root}>
    <Switch>
      <Match when={connection.status === 'connecting'}>
        <IconConnecting
          class={css.spinner}
          width="20"
          height="20"
          role="img"
          aria-label="Connecting to the relay network…"
        />
      </Match>
      <Match when={connection.status === 'connected'}>
        <IconConnected
          class={css.connected}
          width="20"
          height="20"
          role="img"
          aria-label="Connected to the relay network."
        />
      </Match>
      <Match when={connection.status === 'failed'}>
        <IconFailed
          class={css.failed}
          width="20"
          height="20"
          role="img"
          aria-label="Failed to join the relay network."
        />
      </Match>
    </Switch>
  </output>
);
