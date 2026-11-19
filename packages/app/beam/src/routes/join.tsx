import { createEffect, on, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAction, useValue } from '@lib/effects/solid';
import { Callout, Flex, Link, Text } from '@lib/ui';
import { BeamFrame } from '../components/beam-frame';
import { $joinGroup } from '../effects';
import { $device, inviteCodeOf } from '../state';

/**
 * Where an invitation link lands, at `/join/#<code>`. It uses the
 * invitation as soon as this device is open, and moves on to the group.
 *
 * There's nothing to confirm. Opening the link is the decision, and the
 * group's name isn't known until the inviting device has answered.
 *
 * The code is in the fragment, so none of this is prerendered: the server
 * never sees it, and the effects that read it only run on the client.
 */
const BeamJoin = () => {
  const navigate = useNavigate();
  const device = useValue($device);
  const joinGroup = useAction($joinGroup);

  // Once, when the device opens. A code that isn't one is still sent: the
  // device says why, the same way it does for one that's expired.
  createEffect(
    on(
      () => device().status === 'open',
      (open) => {
        if (open) joinGroup(inviteCodeOf(window.location.hash) ?? '');
      },
    ),
  );

  // Replaces this page in history, so Back doesn't replay a spent code.
  createEffect(() => {
    const result = joinGroup.latest;

    if (result && 'groupId' in result) {
      navigate(`/group/${result.groupId}`, { replace: true });
    }
  });

  const failure = () => {
    const result = joinGroup.latest;
    return result && 'reason' in result ? result.reason : null;
  };

  return (
    <BeamFrame trail={[{ label: 'Join' }]}>
      <Show
        when={failure()}
        fallback={
          <Text as="p" selectable={false} color="lowContrast" testId="joining">
            Joining…
          </Text>
        }
      >
        {(reason) => (
          <Callout testId="join-failed" color="danger">
            <Flex as="div" direction="column" gap={2}>
              <Text as="p" selectable>
                Couldn't join: {reason()}. The device that made the invitation
                has to be online with it still showing.
              </Text>
              <Text as="p" selectable={false}>
                <Link testId="join-home" href="/">
                  Back to your groups
                </Link>
              </Text>
            </Flex>
          </Callout>
        )}
      </Show>
    </BeamFrame>
  );
};

export default BeamJoin;
