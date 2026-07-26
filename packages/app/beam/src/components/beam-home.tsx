import { FrameBody, SiteHeader } from '@lib/shell';
import { Container, Flex, Heading, LinkButton, Text } from '@lib/ui';
import IconQrcodeScan from 'virtual:icons/mdi/qrcode-scan';
import IconShareVariant from 'virtual:icons/mdi/share-variant-outline';
import { ConnectionIndicator } from './connection-indicator';

/**
 * The Beam home at `/beam` — the address book, and the app's entry point. It
 * lists the peers this device has paired with and offers the two ways to add
 * another: show an invite for someone else to scan, or scan theirs.
 *
 * The contact list itself is still a work in progress, so today the page is
 * only its empty state. Scanning is delegated wholesale to `@app/qr-scanner`:
 * a beam link is a same-origin URL, which the scanner already resolves to an
 * in-app route, so the tap lands back here at `/beam/share/:id`.
 */
export const BeamHome = () => (
  <>
    <SiteHeader title="Beam" actions={<ConnectionIndicator />} />
    <FrameBody>
      <Container as="div" size={2}>
        <Flex as="div" direction="column" gap={5}>
          <Flex as="hgroup" direction="column" gap={2}>
            <Heading as="h1" selectable={false}>
              Beam
            </Heading>
            <Text as="p" size={2} color="lowContrast" selectable={false}>
              No devices yet. Share an invite, or scan one to pair.
            </Text>
          </Flex>

          <Flex as="div" direction="column" gap={3}>
            <LinkButton testId="beam-invite" href="/beam/invite" size={3}>
              <IconShareVariant width="20" height="20" aria-hidden="true" />
              Share an invite
            </LinkButton>
            <LinkButton
              testId="beam-scan"
              href="/scanner"
              size={3}
              variant="soft"
            >
              <IconQrcodeScan width="20" height="20" aria-hidden="true" />
              Scan a code
            </LinkButton>
          </Flex>
        </Flex>
      </Container>
    </FrameBody>
  </>
);
