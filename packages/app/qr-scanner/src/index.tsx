import { Button, Container, Flex, Heading, Text } from '@lib/ui';
import { SiteHeader } from '@lib/shell';
import IconQrcodeScan from 'virtual:icons/mdi/qrcode-scan';

/**
 * Scanner landing page. Static for now: a heading plus the primary
 * "Start scanning" action. Camera access and decode logic land in a
 * follow-up.
 */
export const QrScanner = () => (
  <>
    <SiteHeader title="Scanner" />

    <Container as="main" size={1} px={4} py={6}>
      <Flex as="div" direction="column" align="center" gap={5}>
        <Flex as="header" direction="column" align="center" gap={2}>
          <Heading as="h1" size={6} weight="medium" align="center">
            Scan a QR code
          </Heading>
          <Text as="p" size={2} color="lowContrast" align="center">
            Point your camera at a QR code. Nothing leaves your device.
          </Text>
        </Flex>

        <Button testId="start-scanning" size={3}>
          <IconQrcodeScan width="20" height="20" aria-hidden="true" />
          Start scanning
        </Button>
      </Flex>
    </Container>
  </>
);
