import type { Group } from '@crate/beam';
import { createEffect, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAction, useValue } from '@lib/effects/solid';
import { Button, Dialog, Flex, Heading, Separator, Text } from '@lib/ui';
import {
  $leaveGroup,
  $renameDevice,
  $renameGroup,
  $replaceGroup,
} from '../effects';
import {
  $feed,
  $groupSettings,
  $groupSettingsToggled,
  DEVICE_NAME_MAX_LENGTH,
  GROUP_NAME_MAX_LENGTH,
} from '../state';
import { MemberList } from './member-list';
import { NameForm } from './name-form';

/**
 * Everything about a group that isn't what's shared to it: what it's
 * called, which devices are in it, what this one is called, and the ways
 * out.
 *
 * A dialog, because all of it is rare. Devices change over years; the
 * feed is why the page is open.
 */
export const GroupSettings = (props: {
  /** The group these are the settings of. */
  group: Group;
}) => {
  const navigate = useNavigate();
  const open = useValue($groupSettings);
  const feed = useValue($feed);
  const toggle = useAction($groupSettingsToggled);
  const renameGroup = useAction($renameGroup);
  const renameDevice = useAction($renameDevice);
  const leaveGroup = useAction($leaveGroup);
  const replaceGroup = useAction($replaceGroup);

  /** Whether any other device in the group can't be reached right now. */
  const someAway = () => feed().members.some((member) => !member.online);

  // Either way out ends somewhere else, with the dialog put away.
  createEffect(() => {
    if (!leaveGroup.latest) return;

    toggle(false);
    navigate('/', { replace: true });
  });

  createEffect(() => {
    const successor = replaceGroup.latest;
    if (!successor) return;

    toggle(false);
    navigate(`/group/${successor}`, { replace: true });
  });

  return (
    <Dialog
      testId="group-settings"
      open={open()}
      onOpenChange={() => toggle(false)}
      title="Group settings"
      maxWidth="28rem"
    >
      <Flex as="div" direction="column" gap={5}>
        <Flex as="section" direction="column" gap={2}>
          <Heading as="h3" size={2} selectable={false}>
            Group name
          </Heading>
          <NameForm
            testId="group"
            label="Group name"
            value={props.group.name}
            maxLength={GROUP_NAME_MAX_LENGTH}
            pending={renameGroup.pending}
            onSave={(name) => renameGroup(props.group.id, name)}
          />
        </Flex>

        <Flex as="section" direction="column" gap={2}>
          <Heading as="h3" size={2} selectable={false}>
            This device
          </Heading>
          <NameForm
            testId="device"
            label="This device's name"
            value={props.group.deviceName}
            maxLength={DEVICE_NAME_MAX_LENGTH}
            pending={renameDevice.pending}
            onSave={(name) => renameDevice(name)}
          />
          <Text as="p" size={1} color="lowContrast" selectable={false}>
            Shown to every device in every group this one is in.
          </Text>
        </Flex>

        <Flex as="section" direction="column" gap={2}>
          <Heading as="h3" size={2} selectable={false}>
            Devices
          </Heading>
          <MemberList groupId={props.group.id} />
          <Text as="p" size={1} color="lowContrast" selectable={false}>
            Removing a device takes most of the group's devices being online to
            agree, the one being removed among those counted. It deletes what it
            held of the group when it hears.
          </Text>
        </Flex>

        <Separator size={4} decorative />

        <Flex as="section" direction="column" gap={3}>
          <Flex as="div" direction="column" gap={1} align="start">
            <Button
              testId="group-leave"
              variant="soft"
              color="danger"
              disabled={leaveGroup.pending}
              onClick={() => leaveGroup(props.group.id)}
            >
              Leave group
            </Button>
            <Text as="p" size={1} color="lowContrast" selectable={false}>
              This device forgets the group and everything shared to it. The
              other devices keep it.
            </Text>
          </Flex>

          {/* Only worth offering when someone's away: with everyone here,
              removing a device the ordinary way works. */}
          <Show when={someAway()}>
            <Flex as="div" direction="column" gap={1} align="start">
              <Button
                testId="group-replace"
                variant="soft"
                color="danger"
                disabled={replaceGroup.pending}
                onClick={() => replaceGroup(props.group.id)}
              >
                Start over without the others
              </Button>
              <Text as="p" size={1} color="lowContrast" selectable={false}>
                For when a device is gone for good and the group can no longer
                agree on anything. Makes a new group from everything synced so
                far, with only this device in it. The others have to be linked
                again.
              </Text>
            </Flex>
          </Show>
        </Flex>
      </Flex>
    </Dialog>
  );
};
