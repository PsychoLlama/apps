import { Match, Show, Switch, createMemo, type JSX } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { Suspense, useClientResource, useValue } from '@lib/effects/solid';
import { Frame } from '@lib/shell';
import { Flex } from '@lib/ui';
import { BeamHeader } from '../components/beam-header';
import { BeamOnboarding } from '../components/beam-onboarding';
import { ContactSidebar } from '../components/contact-sidebar';
import { StatusBar } from '../components/status-bar';
import { $connect, $restoreFromDisk } from '../effects';
import {
  $beamLifetime,
  $onboarding,
  surfaceForRoute,
  surfaceOf,
} from '../state';
import * as styles from './(beam).css';

/**
 * The Beam layout: the `<main>` frame for every route in the `(beam)` group,
 * which is all of them but the 404 page. It holds the session's stores and
 * connection for the whole surface, so the relay connection and the loaded
 * address book survive
 * navigation between the invite view and a peer's share view without
 * re-dialling or re-reading. Each route renders its body inside:
 * `(beam)/index` is the address book at `/`, `(beam)/share/[id]` is one peer
 * at `/share/:id`.
 *
 * The status bar hangs off the frame rather than any one route: it reports on
 * the session, which no single route owns.
 *
 * The contacts rail is the third: on a screen wide enough for it, the address
 * book stays open beside whatever route is in the pane. It's absent below
 * `md`, where the home page carries the same directory inline.
 *
 * All three of them, and the route itself, wait on how far setting this
 * device up has got. Until it's been set up there's no session worth
 * reporting on and no onward route worth showing, so the frame holds the
 * setup flow instead — and while the disk is still answering it holds
 * neither, because picking a surface and swapping it a moment later is a
 * flash of the wrong app.
 *
 * Holding the plans is the only lifecycle wiring here: releasing them on
 * cleanup ends the session and frees the endpoint.
 */
const BeamLayout = (props: { children?: JSX.Element }) => {
  useValue($beamLifetime);

  // Neither the wasm, the handshake, nor IndexedDB can run during SSG, so
  // both start once the client mounts. They're independent, and the disk
  // answers long before the relay does. The connection is never read: it
  // reports through `$connection`.
  const restored = useClientResource($restoreFromDisk);
  useClientResource($connect);

  const location = useLocation();
  const onboarding = useValue($onboarding);

  /** Which screen to show — the derived one, unless the route outranks it. */
  const surface = createMemo(() =>
    surfaceForRoute(surfaceOf(onboarding()), location.pathname),
  );

  return (
    <Frame>
      {/* The rename control stands down for the step whose whole job is to
          collect the name. Two ways to answer one question, one of them a
          modal over the other, and only the form below advances setup. */}
      <BeamHeader
        renameable={surface() === 'pairing' || surface() === 'session'}
      />

      {/* Nothing until the disk has answered: no screen is the right one
          yet, and the frame's header is all there is to show. A failed read
          reaches the error boundary. */}
      <Suspense>
        <Show when={restored()}>
          <Switch>
            <Match when={surface() === 'naming'}>
              <BeamOnboarding step="naming" />
            </Match>

            <Match when={surface() === 'pairing'}>
              <BeamOnboarding step="pairing" />
            </Match>

            <Match when={surface() === 'session'}>
              <Flex as="div" direction="row" class={styles.split}>
                <ContactSidebar />

                {/* The route's own column, filling what the rail leaves. Each
                route renders its body into it. */}
                <Flex as="div" direction="column" class={styles.pane}>
                  {props.children}
                </Flex>
              </Flex>

              <StatusBar />
            </Match>
          </Switch>
        </Show>
      </Suspense>
    </Frame>
  );
};

export default BeamLayout;
