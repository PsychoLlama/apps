import type { Group } from '@crate/beam';
import { createEffect } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAction } from '@lib/effects/solid';
import { Button, Callout, Flex, Text } from '@lib/ui';
import { $leaveGroup } from '../effects';

/**
 * A group this device holds and isn't in yet: it was let in, and the
 * group hasn't agreed. If the group never does, there's nothing to wait
 * for, so it offers to forget it.
 *
 * A device that was in a group and is removed never gets here. It forgets
 * the group by itself.
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
    <Callout testId="group-joining" color="neutral">
      <Flex as="div" direction="column" gap={3} align="start">
        <Text as="p" selectable={false}>
          Joining. This finishes once the group's other devices are online.
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
