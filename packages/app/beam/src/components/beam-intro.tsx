import { Flex, Heading, Text } from '@lib/ui';

/**
 * Beam's title and the sentence under it, as one block.
 *
 * Shared rather than written per page because both surfaces that open with it
 * — the address book and the onboarding flow — are the front of the same app,
 * and a name and a promise that drift apart between them read as two.
 *
 * Plain body text under the title, not a second heading. The title is the
 * only thing on either page with typographic weight to it; a subtitle
 * competing at its own size would give the reader two things to look at
 * first.
 *
 * It doesn't claim the traffic avoids a server — it doesn't. A browser can't
 * hole-punch, so every share goes through an iroh relay; what the relay can't
 * do is read it, which is what "fully encrypted" is saying.
 */
export const BeamIntro = () => (
  <Flex as="hgroup" direction="column" gap={2}>
    <Heading as="h1" size={8} selectable={false}>
      Beam
    </Heading>

    <Text as="p" size={3} selectable={false}>
      Share text, links, and files between devices. Fully encrypted.
    </Text>
  </Flex>
);
