import { Match, Switch } from 'solid-js';
import { useCommit, useRun, useValue } from '@lib/state';
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
import { reportSagaFailure } from '../state/failure';
import { LABEL_MAX_LENGTH, normalizeLabel } from '../state/labels';
import { inviteOpenedTopic } from '../state/view';
import {
  finishNamingSaga,
  setupDraftStore,
  setupNameChangedTopic,
} from '../state/onboarding';
import type { OnboardingStep } from '../state/platform/database';
import * as styles from './beam-onboarding.css';

/**
 * Which step of setting up a device the reader is on. The two the flow
 * actually renders — `done` is the third value the step can take, and it's
 * the one where this component isn't on screen at all.
 */
export type SetupStep = Exclude<OnboardingStep, 'done'>;

/** How many steps there are, for the counter and the bar to agree on. */
const STEP_COUNT = 2;

/** Where each step sits in the sequence, for the reader's benefit. */
const STEP_NUMBER: Record<SetupStep, number> = {
  naming: 1,
  pairing: 2,
};

/** Ties the field to its label. Only one setup form is ever mounted. */
const NAME_FIELD_ID = 'beam-device-name';

/** The form control's name. Autofill and the platform read it; nothing here
 * does — the submit takes what was typed from the scope. */
const NAME_FIELD = 'label';

/**
 * Setting up a device, as two things done in order: name it, then meet
 * another device with it.
 *
 * Both are the reader's to start. The first is what everyone they pair with
 * will know this device by, and the second ends up on someone else's screen —
 * neither is the kind of thing to do on a visitor's behalf while they're
 * still reading the page.
 *
 * The step is a prop rather than state of its own. It's read from the scope
 * one level up, where it's persisted, so a step finished here is a step
 * finished for good and there's no way to be looking at step two on a device
 * that never got through step one.
 *
 * Nothing here says how to leave. Step two ends when a device turns up, which
 * is the thing it's asking for — a flow with a way past it is a flow that
 * gets pressed past.
 */
export const BeamOnboarding = (props: { step: SetupStep }) => {
  const draft = useValue(setupDraftStore);
  const finishNaming = useRun(finishNamingSaga);
  const commit = useCommit();

  /** The name as typed, held in the scope so a stumble doesn't lose it. */
  const name = () => draft().name;

  /**
   * Whether there's a name to save. Measured with the rule that will actually
   * decide, so the button can't offer to submit something the saga would turn
   * away — a field holding two spaces looks filled in and isn't.
   */
  const named = () => normalizeLabel(name()) !== null;

  /**
   * Sent from the draft rather than from `FormData`. The scope already holds
   * what was typed, and reading the field back would make a second source of
   * truth out of the one the button is enabled from.
   */
  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();

    // Enter in a single-field form submits it whatever the button is doing,
    // so the requirement is enforced here too rather than only on the button.
    if (!named()) return;

    void finishNaming(name()).catch(
      reportSagaFailure('The device naming saga failed.'),
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
                <Match when={props.step === 'naming'}>
                  <Flex as="div" direction="column" gap={2}>
                    <Heading as="h2" size={4} selectable={false}>
                      Name this device
                    </Heading>

                    {/* Where the name ends up, rather than what the step does
                        underneath. A key is minted here too, but the reader
                        is being asked for one thing and the sentence answers
                        the question they'd actually ask about it: who sees
                        this?

                        Both halves earn their place. The first is the moment
                        of connecting, the second is that the name outlives
                        it — and it's the second that gets people to type
                        something they'd want a stranger to read back. */}
                    <Text
                      as="p"
                      size={2}
                      color="lowContrast"
                      selectable={false}
                    >
                      This is how you appear to other devices and how they’ll
                      save you in their contacts.
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

                      {/* The placeholder names a person as well as a thing.
                          The name is read by whoever is on the other end, and
                          "Phone" tells them nothing once they know two
                          people with one. */}
                      <TextField
                        testId="beam-device-name"
                        id={NAME_FIELD_ID}
                        name={NAME_FIELD}
                        placeholder="Carol’s Phone"
                        value={name()}
                        onInput={(event) =>
                          commit(
                            setupNameChangedTopic(event.currentTarget.value),
                          )
                        }
                        maxlength={LABEL_MAX_LENGTH}
                        autofocus
                        autocomplete="off"
                        autocapitalize="words"
                        enterkeyhint="done"
                      />
                    </Flex>

                    {/* Disabled rather than hidden, and rather than letting
                        the submit fail: the button is the only thing on
                        screen saying the field has to be filled in, so it
                        has to be visibly waiting on it. */}
                    <Flex as="div" direction="row">
                      <Button
                        testId="beam-name-device"
                        type="submit"
                        disabled={!named()}
                      >
                        Next
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
