import { onMount, type JSX } from 'solid-js';
import { useAnchor, useRun } from '@lib/state';
import { Frame } from '@lib/shell';
import { Flex } from '@lib/ui';
import { BeamHeader } from './beam-header';
import { ContactSidebar } from './contact-sidebar';
import { PairingBanner } from './pairing-banner';
import { StatusBar } from './status-bar';
import { connectRelaySaga, reportSagaFailure } from '../state/session';
import { restoreContactsSaga } from '../state/contacts';
import { beamScope } from '../state/scope';
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
 * The anchor is the only lifecycle wiring here: releasing it on cleanup
 * aborts the connect and frees the endpoint.
 */
export const BeamLayout = (props: { children?: JSX.Element }) => {
  useAnchor(beamScope);
  const connect = useRun(connectRelaySaga);
  const restore = useRun(restoreContactsSaga);

  onMount(() => {
    // Neither the wasm, the handshake, nor IndexedDB can run during SSG, so
    // both start once the client mounts. They're independent: the address
    // book is readable whether or not the endpoint ever comes up.
    void connect().catch(reportSagaFailure('The beam connect saga failed.'));
    void restore().catch(
      reportSagaFailure('The address book restore saga failed.'),
    );
  });

  return (
    <Frame>
      <BeamHeader />

      <Flex as="div" direction="row" class={styles.split}>
        <ContactSidebar />

        {/* The route's own column, filling what the rail leaves. Each route
            renders its body into it. */}
        <Flex as="div" direction="column" class={styles.pane}>
          {props.children}
        </Flex>
      </Flex>

      <PairingBanner />
      <StatusBar />
    </Frame>
  );
};
