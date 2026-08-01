import { Match, Switch } from 'solid-js';
import { useCommit, useRun } from '@lib/state';
import { FrameBody } from '@lib/shell';
import {
  Button,
  Container,
  Flex,
  Heading,
  Progress,
  Text,
  TextField,
} from '@lib/ui';
import IconShareVariant from 'virtual:icons/mdi/share-variant-outline';
import { BeamIntro } from './beam-intro';
import { InviteDialog } from './invite-dialog';
import {
  createIdentitySaga,
  inviteOpenedTopic,
  reportSagaFailure,
} from '../state/session';
import { LABEL_MAX_LENGTH } from '../state/labels';
import * as styles from './beam-onboarding.css';

/**
 * Which step of setting up a device the reader is on. Derived rather than
 * held — see `state/surface.ts` — so there is no way to be on a step the
 * device hasn't actually reached.
 */
export type OnboardingStep = 'identity' | 'pairing';

/** How many steps there are, for the counter and the bar to agree on. */
const STEP_COUNT = 2;

/** Where each step sits in the sequence, for the reader's benefit. */
const STEP_NUMBER: Record<OnboardingStep, number> = {
  identity: 1,
  pairing: 2,
};

/** Ties the field to its label. Only one setup form is ever mounted. */
const NAME_FIELD_ID = 'beam-device-name';

/** The form control's name, and the key the submit handler reads back. */
const NAME_FIELD = 'label';

/**
 * Setting up a device, as two things done in order: mint an identity, then
 * meet another device with it.
 *
 * Both are the reader's to start. The first is a key that other people will
 * come to know this device by, and the second ends up on someone else's
 * screen — neither is the kind of thing to do on a visitor's behalf while
 * they're still reading the page.
 *
 * The step is a prop rather than state of its own: what you've got decides
 * what you see, so there is no "next" to press and no way to be looking at
 * step two on a device that never finished step one.
 *
 * Nothing here says how to leave. Step two ends when a device turns up, which
 * is the thing it's asking for — a flow with a way past it is a flow that
 * gets pressed past.
 */
export const BeamOnboarding = (props: { step: OnboardingStep }) => {
  const create = useRun(createIdentitySaga);
  const commit = useCommit();

  const handleSubmit = (
    event: SubmitEvent & { currentTarget: HTMLFormElement },
  ) => {
    event.preventDefault();

    // `FormData` widens to `File` for the general case; a text input only ever
    // yields a string, so anything else is treated as an empty field.
    const entry = new FormData(event.currentTarget).get(NAME_FIELD);

    void create(typeof entry === 'string' ? entry : '').catch(
      reportSagaFailure('The identity creation saga failed.'),
    );
  };

  return (
    <>
      <FrameBody as="section">
        <Container as="div" size={3} align="start">
          <Flex as="div" direction="column" gap={6}>
            <BeamIntro />

            <Flex
              as="div"
              direction="column"
              gap={4}
              class={styles.step}
              aria-live="polite"
            >
              {/* The counter, the bar, and the title say the same thing three
                  ways on purpose: the bar is the glance, the counter is the
                  number, and the title is what you're actually being asked
                  to do. A two-step flow is short enough that the reader
                  should be able to see the end of it from the start. */}
              <Flex as="div" direction="column" gap={2}>
                <Text as="p" size={1} color="lowContrast" selectable={false}>
                  Step {STEP_NUMBER[props.step]} of {STEP_COUNT}
                </Text>

                <Progress
                  testId="beam-onboarding-progress"
                  size={1}
                  value={STEP_NUMBER[props.step]}
                  max={STEP_COUNT}
                  getValueLabel={(value, max) => `Step ${value} of ${max}`}
                />
              </Flex>

              <Switch>
                <Match when={props.step === 'identity'}>
                  <Flex as="div" direction="column" gap={2}>
                    <Heading as="h2" size={4} selectable={false}>
                      Create an identity
                    </Heading>

                    {/* Says what the key is for and what it costs, because
                        this is the one irreversible thing in the flow: the
                        address other devices save is derived from it, so a
                        second one makes this device a stranger to everyone
                        who kept the first. */}
                    <Text
                      as="p"
                      size={2}
                      color="lowContrast"
                      selectable={false}
                    >
                      Beam gives this device a key of its own. Other devices
                      will know it by the name you choose.
                    </Text>
                  </Flex>

                  <Flex
                    as="form"
                    direction="column"
                    gap={4}
                    onSubmit={handleSubmit}
                  >
                    <Flex as="div" direction="column" gap={2}>
                      <Text
                        as="label"
                        for={NAME_FIELD_ID}
                        size={2}
                        weight="medium"
                        selectable={false}
                      >
                        Device name
                      </Text>

                      {/* Not required. A device with no name goes by the
                          start of its own key, which is what an unnamed
                          contact wears — so leaving this blank costs a
                          friendly name and nothing else, and holding up the
                          only step that matters over it would be a toll. */}
                      <TextField
                        testId="beam-device-name"
                        id={NAME_FIELD_ID}
                        name={NAME_FIELD}
                        placeholder="This laptop"
                        maxlength={LABEL_MAX_LENGTH}
                        autofocus
                        autocomplete="off"
                        autocapitalize="words"
                        enterkeyhint="done"
                      />
                    </Flex>

                    <Flex as="div" direction="row">
                      <Button testId="beam-create-identity" type="submit">
                        Create identity
                      </Button>
                    </Flex>
                  </Flex>
                </Match>

                <Match when={props.step === 'pairing'}>
                  <Flex as="div" direction="column" gap={2}>
                    <Heading as="h2" size={4} selectable={false}>
                      Connect a device
                    </Heading>

                    <Text
                      as="p"
                      size={2}
                      color="lowContrast"
                      selectable={false}
                    >
                      Open Beam on another device and scan this one’s code. Once
                      they’ve met, you’re set up.
                    </Text>
                  </Flex>

                  <Flex as="div" direction="row">
                    <Button
                      testId="beam-onboarding-invite"
                      onClick={() => commit(inviteOpenedTopic())}
                    >
                      <IconShareVariant
                        width="20"
                        height="20"
                        aria-hidden="true"
                      />
                      Show beam link
                    </Button>
                  </Flex>
                </Match>
              </Switch>
            </Flex>
          </Flex>
        </Container>
      </FrameBody>

      {/* The same invite the address book opens. It hangs off this device's
          key rather than its relay connection, so it's readable the moment
          step one lands — the handshake behind it can still be in flight. */}
      <InviteDialog />
    </>
  );
};
