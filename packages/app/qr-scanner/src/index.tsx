import { Button, Container, Flex, Heading, Section, Text } from '@lib/ui';
import { SiteHeader } from '@lib/shell';
import IconQrcodeScan from 'virtual:icons/mdi/qrcode-scan';
import * as css from './index.css';

/**
 * QR scanner landing page. Static for now — a framed reticle plus the
 * primary "Start scanning" action. Camera access and decode logic land
 * in a follow-up.
 */
export const QrScanner = () => (
  <Flex as="main" direction="column" align="center" grow>
    <SiteHeader title="Scanner" />

    <Section size={2}>
      <Container as="div" size={1} px={4}>
        <Flex as="div" direction="column" align="center" gap={5}>
          <Flex
            as="div"
            align="center"
            justify="center"
            class={css.viewport}
            aria-hidden="true"
          >
            <IconQrcodeScan width="72" height="72" class={css.reticleIcon} />
            <Flex as="div" class={`${css.corner} ${css.cornerTopLeft}`} />
            <Flex as="div" class={`${css.corner} ${css.cornerTopRight}`} />
            <Flex as="div" class={`${css.corner} ${css.cornerBottomLeft}`} />
            <Flex as="div" class={`${css.corner} ${css.cornerBottomRight}`} />
          </Flex>

          <Flex as="header" direction="column" align="center" gap={2}>
            <Heading as="h1" size={6} weight="medium" align="center">
              Scan a QR code
            </Heading>
            <Text as="p" size={2} color="lowContrast" align="center">
              Point your camera at a QR code to read its contents. Decoding
              happens on your device — nothing is uploaded.
            </Text>
          </Flex>

          <Button testId="start-scanning" size={3} class={css.startButton}>
            <IconQrcodeScan width="20" height="20" aria-hidden="true" />
            Start scanning
          </Button>
        </Flex>
      </Container>
    </Section>
  </Flex>
);
