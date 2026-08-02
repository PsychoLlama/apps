import { Match, Switch, onMount, type JSX } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { useAnchor, useRun, useValue } from '@lib/state';
import { Frame } from '@lib/shell';
import { Flex } from '@lib/ui';
import { BeamHeader } from './beam-header';
import { BeamOnboarding } from './beam-onboarding';
import { ContactSidebar } from './contact-sidebar';
import { PairingBanner } from './pairing-banner';
import { StatusBar } from './status-bar';
import { restoreContactsSaga } from '../state/contacts';
import { reportSagaFailure } from '../state/failure';
import { connectRelaySaga } from '../state/network';
import { restoreOnboardingSaga } from '../state/onboarding';
import { beamScope } from '../state/scope';
import { beamSurfaceFormula, surfaceForRoute } from '../state/view';
import * as styles from './beam-layout.css';

/**
 * The Beam layout: the `<main>` frame for every `/beam/*` route. It anchors
 * the session scope for the whole surface, so the relay connection and the
 * loaded address book survive navigation between the invite view and a peer's
 * share view without re-dialling or re-reading. Each route renders its own
 * header and body inside.
 *
 * Pairing requests hang off the frame rather than any one route: a peer can
 * ask at any moment, and the reader shouldn't have to be on a particular
 * page to hear it. The status bar below them is here for the same reason in
 * reverse — it reports on the session, which no single route owns.
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
 * The anchor is the only lifecycle wiring here: releasing it on cleanup
 * aborts the connect and frees the endpoint.
 */
export const BeamLayout = (props: { children?: JSX.Element }) => {
  useAnchor(beamScope);
  const location = useLocation();
  const derived = useValue(beamSurfaceFormula);
  const connect = useRun(connectRelaySaga);
  const restoreContacts = useRun(restoreContactsSaga);
  const restoreOnboarding = useRun(restoreOnboardingSaga);

  /** Which screen to show — the derived one, unless the route outranks it. */
  const surface = () => surfaceForRoute(derived(), location.pathname);

  onMount(() => {
    // Neither the wasm, the handshake, nor IndexedDB can run during SSG, so
    // all three start once the client mounts. They're independent, and the
    // disk answers long before the relay does: the contact store — this
    // device's own row included — and how far its setup has got are both
    // readable whether or not the endpoint ever comes up.
    void connect().catch(reportSagaFailure('The beam connect saga failed.'));
    void restoreContacts().catch(
      reportSagaFailure('The address book restore saga failed.'),
    );
    void restoreOnboarding().catch(
      reportSagaFailure('The setup progress restore saga failed.'),
    );
  });

  return (
    <Frame>
      {/* The rename control stands down for the step whose whole job is to
          collect the name. Two ways to answer one question, one of them a
          modal over the other, and only the form below advances setup. */}
      <BeamHeader
        renameable={surface() === 'pairing' || surface() === 'session'}
      />

      {/* `unknown` matches nothing on purpose: it's the state where no screen
          is the right one, and the frame's header is all there is to show. */}
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

          <PairingBanner />
          <StatusBar />
        </Match>
      </Switch>
    </Frame>
  );
};
