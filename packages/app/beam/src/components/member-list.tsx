import { For, Show } from 'solid-js';
import { useAction, useValue } from '@lib/effects/solid';
import { AlertDialog, Button, Flex, Text } from '@lib/ui';
import { $removeDevice } from '../effects';
import { $feed, $removal, $removalAsked, deviceLabel } from '../state';

/**
 * The devices in a group: what each is called, and a way to remove the
 * ones that aren't this one.
 *
 * A name is another device's word and is only ever rendered as text.
 *
 * Removing is asked twice. It deletes the group from someone's device,
 * and the button sits in a list where a slip is easy.
 *
 * It then asks the group, and the group has to agree. The device stays
 * listed until it does, which is how a removal that's still waiting on
 * someone shows.
 */
export const MemberList = (props: {
  /** The group whose devices these are. */
  groupId: string;
}) => {
  const feed = useValue($feed);
  const removal = useValue($removal);
  const askRemoval = useAction($removalAsked);
  const removeDevice = useAction($removeDevice);

  /** This device first, then the rest as the group lists them. */
  const members = () =>
    feed().members.toSorted(
      (left, right) => Number(right.me) - Number(left.me),
    );

  /** The device being asked about, while it's still in the group. */
  const asked = () => feed().members.find((it) => it.id === removal());

  return (
    <>
      <Flex as="ul" direction="column" gap={3} testId="members">
        <For each={members()}>
          {(member) => (
            <Flex as="li" align="center" justify="between" gap={5}>
              <Text as="span" truncate selectable={false} testId="member-name">
                {deviceLabel(member)}
              </Text>

              <Show
                when={!member.me}
                fallback={
                  <Text
                    as="span"
                    size={1}
                    color="lowContrast"
                    selectable={false}
                  >
                    This device
                  </Text>
                }
              >
                <Button
                  testId="member-remove"
                  variant="ghost"
                  color="danger"
                  size={1}
                  disabled={removeDevice.pending}
                  onClick={() => askRemoval(member.id)}
                >
                  Remove
                </Button>
              </Show>
            </Flex>
          )}
        </For>
      </Flex>

      <AlertDialog
        testId="member-remove-confirm"
        open={asked() !== undefined}
        onOpenChange={() => askRemoval(null)}
        title={`Remove ${asked() ? deviceLabel(asked()!) : 'device'}?`}
        description="It leaves the group and deletes its copy of everything shared here. This happens once most of the group's devices are online to agree."
        actionText="Remove"
        color="danger"
        onAction={() => {
          const device = asked();
          if (device) removeDevice(props.groupId, device.id);
        }}
      />
    </>
  );
};
