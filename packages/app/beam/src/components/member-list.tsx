import { For, Show } from 'solid-js';
import { useAction, useValue } from '@lib/effects/solid';
import { Badge, Flex, IconButton, Text } from '@lib/ui';
import IconRemove from 'virtual:icons/mdi/close';
import { $removeDevice } from '../effects';
import { $feed, deviceLabel } from '../state';

/**
 * The devices in a group: what each is called, whether it's reachable
 * right now, and a way to remove the ones that aren't this one.
 *
 * A name is another device's word and is only ever rendered as text.
 *
 * Removing asks the group, and the group has to agree. The device stays
 * listed until it does, which is how a removal that's still waiting on
 * someone shows.
 */
export const MemberList = (props: {
  /** The group whose devices these are. */
  groupId: string;
}) => {
  const feed = useValue($feed);
  const removeDevice = useAction($removeDevice);

  /** This device first, then the rest as the group lists them. */
  const members = () =>
    feed().members.toSorted(
      (left, right) => Number(right.me) - Number(left.me),
    );

  return (
    <Flex as="ul" direction="column" gap={2} testId="members">
      <For each={members()}>
        {(member) => (
          <Flex as="li" align="center" justify="between" gap={2}>
            <Text as="span" truncate selectable={false} testId="member-name">
              {deviceLabel(member)}
            </Text>

            <Flex as="div" align="center" gap={2}>
              <Show
                when={!member.me}
                fallback={
                  <Badge color="neutral" variant="soft">
                    This device
                  </Badge>
                }
              >
                <Badge
                  color={member.online ? 'success' : 'neutral'}
                  variant="soft"
                >
                  {member.online ? 'Online' : 'Offline'}
                </Badge>

                <IconButton
                  testId="member-remove"
                  aria-label={`Remove ${deviceLabel(member)} from the group`}
                  variant="ghost"
                  color="danger"
                  size={1}
                  disabled={removeDevice.pending}
                  onClick={() => removeDevice(props.groupId, member.id)}
                >
                  <IconRemove aria-hidden="true" />
                </IconButton>
              </Show>
            </Flex>
          </Flex>
        )}
      </For>
    </Flex>
  );
};
