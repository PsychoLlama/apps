import { onCleanup, onMount } from 'solid-js';
import { useEffect } from '@lib/state';
import { Frame, FrameBody, SiteHeader } from '@lib/shell';
import { Callout, Container, Text } from '@lib/ui';
import { ConnectionIndicator } from './components/connection-indicator';
import {
  openConnectionEffect,
  releaseConnectionEffect,
} from './state/connection';

/**
 * Peer-to-peer resource sharing — links and files exchanged directly
 * between devices. Currently a stub: the surface is wired up and joins the
 * iroh relay network on mount, but the sharing flow itself is still a work
 * in progress.
 */
export const Share = () => {
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

  return (
    <Frame>
      <SiteHeader title="Share" actions={<ConnectionIndicator />} />
      <FrameBody>
        <Container as="div" size={2}>
          <Callout color="neutral">
            <Text as="span" size={2} selectable={false}>
              Work in progress.
            </Text>
          </Callout>
        </Container>
      </FrameBody>
    </Frame>
  );
};
