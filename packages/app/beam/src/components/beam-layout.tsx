import { onMount, type JSX } from 'solid-js';
import { useAnchor, useRun } from '@lib/state-next';
import { Frame } from '@lib/shell';
import { beamScope, connectRelay, reportSagaFailure } from '../state/session';

/**
 * The Beam layout: the `<main>` frame for every `/beam/*` route. It anchors
 * the session scope for the whole surface, so the relay connection survives
 * navigation between the invite view and a peer's share view without
 * re-dialling. Each route renders its own header and body inside.
 *
 * The anchor is the only lifecycle wiring here: releasing it on cleanup
 * aborts the connect and frees the relay.
 */
export const BeamLayout = (props: { children?: JSX.Element }) => {
  useAnchor(beamScope);
  const connect = useRun(connectRelay);

  onMount(() => {
    // Neither the wasm nor the handshake can run during SSG, so join the
    // network once the client mounts.
    void connect().catch(reportSagaFailure('The beam connect saga failed.'));
  });

  return <Frame>{props.children}</Frame>;
};
