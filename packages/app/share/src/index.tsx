import { Frame, FrameBody, SiteHeader } from '@lib/shell';
import { Callout, Container, Text } from '@lib/ui';

/**
 * Peer-to-peer resource sharing — links and files exchanged directly
 * between devices. Currently a stub: the surface is wired up, but the
 * sharing flow itself is still a work in progress.
 */
export const Share = () => {
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
