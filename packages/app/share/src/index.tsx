import { onCleanup, onMount } from 'solid-js';
import init, { connect } from '@crate/iroh';
import { createLogger, toError } from '@lib/observability';
import { Frame, FrameBody, SiteHeader } from '@lib/shell';
import { Callout, Container, Text } from '@lib/ui';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Instantiate the iroh wasm module and join the public relay network.
 * Both steps are async and client-only (the wasm fetches and the relay
 * handshake can't run during prerender), so this is driven from
 * `onMount`. `cancelled` guards against the page unmounting mid-connect.
 */
const joinRelayNetwork = async (cancelled: () => boolean) => {
  await init();
  if (cancelled()) return;
  logger.debug('Iroh wasm initialized.');

  const connection = await connect();
  if (cancelled()) {
    // Unmounted before the handshake landed — drop the endpoint so its
    // relay connection doesn't linger.
    connection.free();
    return;
  }

  logger.debug('Connected to iroh relay.', {
    endpointId: connection.endpointId,
    homeRelay: connection.homeRelay,
  });
};

/**
 * Peer-to-peer resource sharing — links and files exchanged directly
 * between devices. Currently a stub: the surface is wired up, but the
 * sharing flow itself is still a work in progress.
 */
export const Share = () => {
  let unmounted = false;

  onMount(() => {
    void joinRelayNetwork(() => unmounted).catch((error: unknown) => {
      logger.error('Failed to join the iroh relay network.', {
        error: toError(error),
      });
    });
  });

  onCleanup(() => {
    unmounted = true;
  });

  return (
    <Frame>
      <SiteHeader title="Share" />
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
