import { Show } from 'solid-js';
import { FrameBody, SiteHeader } from '@lib/shell';
import { Callout, Code, Container, Flex, Heading, Text } from '@lib/ui';
import { ConnectionIndicator } from './connection-indicator';
import { connection } from '../state/connection';
import * as css from './share-view.css';

/**
 * A shareable link to this endpoint — the `/share/:endpoint` URL a peer opens
 * to dial us, keyed by the endpoint's public identity. Only ever built
 * client-side (the endpoint is `null` until the client-only connect lands), so
 * `window.location.origin` is safe to read.
 */
const shareLink = (endpointId: string): string =>
  new URL(`/share/${endpointId}`, window.location.origin).href;

/**
 * The sharer's view at `/share`. Still a stub — the sharing flow itself is a
 * work in progress — but once the relay connection is live it surfaces this
 * endpoint's share link as a selectable snippet, ready to hand to a peer.
 */
export const Share = () => (
  <>
    <SiteHeader title="Share" actions={<ConnectionIndicator />} />
    <FrameBody>
      <Container as="div" size={2}>
        <Flex as="div" direction="column" gap={4}>
          <Heading as="h1" selectable={false}>
            Sharing link
          </Heading>

          <Callout color="neutral">
            <Text as="span" size={2} selectable={false}>
              Work in progress.
            </Text>
          </Callout>

          <Show when={connection.endpoint}>
            {(endpoint) => (
              <Code color="neutral" size={2} selectable class={css.shareLink}>
                {shareLink(endpoint().current.endpointId)}
              </Code>
            )}
          </Show>
        </Flex>
      </Container>
    </FrameBody>
  </>
);
