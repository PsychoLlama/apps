import type { Group } from '@crate/beam';
import { createEffect } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAction } from '@lib/effects/solid';
import { Button, Callout, Flex, Text } from '@lib/ui';
import { $leaveGroup } from '../effects';

/**
 * A group this device holds and isn't in: either it was just let in and
 * the group hasn't agreed yet, or it was in and has been removed.
 *
 * Both end the same way if nothing changes, so both offer to forget it.
 */
export const GroupOutside = (props: {
  /** The group. */
  group: Group;
}) => {
  const navigate = useNavigate();
  const leaveGroup = useAction($leaveGroup);

  createEffect(() => {
    if (leaveGroup.latest) navigate('/', { replace: true });
  });

  return (
    <Callout
      testId={props.group.removed ? 'group-removed' : 'group-joining'}
      color={props.group.removed ? 'warning' : 'neutral'}
    >
      <Flex as="div" direction="column" gap={3} align="start">
        <Text as="p" selectable={false}>
          {props.group.removed
            ? 'This device was removed from the group. Nothing shared since then reaches it.'
            : "Joining. This device is let in once enough of the group's devices are online to agree to it."}
        </Text>

        <Button
          testId="group-forget"
          variant="soft"
          color="neutral"
          size={1}
          disabled={leaveGroup.pending}
          onClick={() => leaveGroup(props.group.id)}
        >
          Forget this group
        </Button>
      </Flex>
    </Callout>
  );
};
