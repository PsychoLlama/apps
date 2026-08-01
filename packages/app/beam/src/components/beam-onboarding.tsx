import { FrameBody } from '@lib/shell';
import { Callout, Container, Text } from '@lib/ui';

/**
 * What `/beam/*` renders on a device with no endpoint key: the surface that
 * has to come before a session can exist.
 *
 * A scaffold. The flow itself — minting a key, and whatever it takes to
 * explain what that means before it happens — isn't built yet, so this is the
 * shape it will fill rather than the thing. It says so plainly instead of
 * dressing up as a step, because a first-run screen that looks finished and
 * does nothing is worse than an empty one that admits it.
 *
 * Deliberately alone on the page: no contacts rail, no status bar, no pairing
 * banner. Every one of those reports on a session this device can't have yet,
 * and a chrome full of empty readings would be the first thing a new arrival
 * sees.
 *
 * Neutral, not a warning. Nothing has gone wrong on a device that simply
 * hasn't been set up.
 */
export const BeamOnboarding = () => (
  <FrameBody as="section">
    <Container as="div" size={3} align="start">
      <Callout color="neutral" testId="beam-onboarding">
        <Text as="p" size={2} selectable={false}>
          Work in progress.
        </Text>
      </Callout>
    </Container>
  </FrameBody>
);
