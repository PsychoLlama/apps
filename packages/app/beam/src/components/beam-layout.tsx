import { onCleanup, onMount, type JSX } from 'solid-js';
import { useEffect } from '@lib/state';
import { Frame } from '@lib/shell';
import {
  openConnectionEffect,
  releaseConnectionEffect,
} from '../state/session';

/**
 * The Beam layout: the `<main>` frame for every `/beam/*` route. It holds
 * the browser's iroh relay connection open for the whole surface, so the
 * endpoint survives navigation between the sharer's view and a peer's
 * `/beam/:endpoint` view without re-dialling. Each route renders its own
 * header and body inside.
 */
export const BeamLayout = (props: { children?: JSX.Element }) => {
  const openConnection = useEffect(openConnectionEffect);
  const releaseConnection = useEffect(releaseConnectionEffect);

  onMount(() => {
    // The wasm can't be instantiated nor the relay dialled during SSG, so
    // join the network once the client mounts. The controller lets the
    // cleanup cancel a connect that's still in flight.
    const controller = new AbortController();
    void openConnection(controller.signal);

    onCleanup(() => {
      controller.abort();
      void releaseConnection();
    });
  });

  return <Frame>{props.children}</Frame>;
};
