import { FrameBody, SiteHeader } from '@lib/shell';
import { Callout, Container, Text } from '@lib/ui';
import { ConnectionIndicator } from './connection-indicator';

/**
 * The peer's view at `/share/:endpoint` — where a share link lands, dialling
 * the endpoint named in the URL. Currently a stub: the connection is held open
 * by the layout, but the receiving flow itself is still a work in progress.
 */
export const ShareEndpoint = () => (
  <>
    <SiteHeader
      trail={[{ label: 'Share', href: '/share' }, { label: 'Endpoint' }]}
      actions={<ConnectionIndicator />}
    />
    <FrameBody>
      <Container as="div" size={2}>
        <Callout color="neutral">
          <Text as="span" size={2} selectable={false}>
            Work in progress.
          </Text>
        </Callout>
      </Container>
    </FrameBody>
  </>
);
