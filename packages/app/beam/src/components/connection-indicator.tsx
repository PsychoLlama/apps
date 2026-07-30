import { Match, Switch } from 'solid-js';
import { useValue } from '@lib/state';
import IconConnecting from 'virtual:icons/mdi/loading';
import IconConnected from 'virtual:icons/mdi/check-circle-outline';
import IconFailed from 'virtual:icons/mdi/alert-circle-outline';
import { connectionStore } from '../state/session';
import * as css from './connection-indicator.css';

/**
 * Relay-connection status for the header's actions tray. A spinning glyph
 * while no relay is carrying this device, resolving to a check once one is,
 * or an alert if the connect errored.
 *
 * The spinner is the default rather than a state something has to reach, so
 * it ships in the prerendered markup: connecting starts on mount and nothing
 * cancels it, which makes an empty tray a frame or two of lie. It comes back
 * if a relay drops, too — iroh goes and finds another, and that's the same
 * news as the first time.
 *
 * The `<output>` is an implicit `status` live region, and each glyph carries
 * its own `aria-label`, so swapping one in announces the new state to
 * assistive tech.
 */
export const ConnectionIndicator = () => {
  const connection = useValue(connectionStore);

  return (
    <output class={css.root} title={connection().homeRelay ?? undefined}>
      <Switch
        fallback={
          <IconConnecting
            class={css.spinner}
            width="20"
            height="20"
            role="img"
            aria-label="Connecting to the relay network…"
          />
        }
      >
        <Match when={connection().status === 'connected'}>
          <IconConnected
            class={css.connected}
            width="20"
            height="20"
            role="img"
            aria-label="Connected to the relay network."
          />
        </Match>
        <Match when={connection().status === 'failed'}>
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
};
