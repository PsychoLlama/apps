import type { Group } from '@crate/beam';
import { createEffect, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { SettingsSection } from '@app/settings/components';
import { useAction, useValue } from '@lib/effects/solid';
import { Button, Flex } from '@lib/ui';
import {
  $leaveGroup,
  $renameDevice,
  $renameGroup,
  $replaceGroup,
} from '../effects';
import {
  $feed,
  DEVICE_NAME_MAX_LENGTH,
  GROUP_NAME_MAX_LENGTH,
  groupLabel,
} from '../state';
import { MemberList } from './member-list';
import { NameForm } from './name-form';

/**
 * Everything about a group that isn't what's shared to it: what it's
 * called, which devices are in it, what this one is called, and the ways
 * out.
 *
 * A page of its own, because all of it is rare. Devices change over
 * years; the feed is why the app is open.
 */
export const GroupSettings = (props: {
  /** The group these are the settings of. */
  group: Group;
}) => {
  const navigate = useNavigate();
  const feed = useValue($feed);
  const renameGroup = useAction($renameGroup);
  const renameDevice = useAction($renameDevice);
  const leaveGroup = useAction($leaveGroup);
  const replaceGroup = useAction($replaceGroup);

  /** Whether any other device in the group can't be reached right now. */
  const someAway = () => feed().members.some((member) => !member.online);

  // Either way out ends somewhere else.
  createEffect(() => {
    if (leaveGroup.latest) navigate('/', { replace: true });
  });

  createEffect(() => {
    const successor = replaceGroup.latest;
    if (successor) navigate(`/group/${successor}`, { replace: true });
  });

  return (
    <Flex as="div" direction="column" gap={7} testId="group-settings">
      <SettingsSection
        title="Group name"
        headingId="group-name-heading"
        description="Shown to every device in the group. Leave it empty and the group goes by “My devices”."
      >
        <NameForm
          testId="group"
          label="Group name"
          value={props.group.name}
          placeholder={groupLabel({ name: '' })}
          maxLength={GROUP_NAME_MAX_LENGTH}
          pending={renameGroup.pending}
          onSave={(name) => renameGroup(props.group.id, name)}
        />
      </SettingsSection>

      <SettingsSection
        title="This device"
        headingId="device-name-heading"
        description="What the others see this device as, in every group it's in."
      >
        <NameForm
          testId="device"
          label="This device's name"
          value={props.group.deviceName}
          maxLength={DEVICE_NAME_MAX_LENGTH}
          pending={renameDevice.pending}
          onSave={(name) => renameDevice(name)}
        />
      </SettingsSection>

      <SettingsSection
        title="Devices"
        headingId="devices-heading"
        description="Removing a device takes most of the group's devices being online to agree, the one being removed among those counted. It deletes what it held of the group when it hears."
      >
        <MemberList groupId={props.group.id} />
      </SettingsSection>

      <SettingsSection
        title="Leave group"
        headingId="leave-heading"
        description="This device forgets the group and everything shared to it. The other devices keep it."
      >
        <Flex as="div">
          <Button
            testId="group-leave"
            variant="soft"
            color="danger"
            disabled={leaveGroup.pending}
            onClick={() => leaveGroup(props.group.id)}
          >
            Leave group
          </Button>
        </Flex>
      </SettingsSection>

      {/* Only worth offering when someone's away: with everyone here,
          removing a device the ordinary way works. */}
      <Show when={someAway()}>
        <SettingsSection
          title="Start over"
          headingId="replace-heading"
          description="For when a device is gone for good and the group can no longer agree on anything. Makes a new group from everything synced so far, with only this device in it. The others have to be linked again."
        >
          <Flex as="div">
            <Button
              testId="group-replace"
              variant="soft"
              color="danger"
              disabled={replaceGroup.pending}
              onClick={() => replaceGroup(props.group.id)}
            >
              Start over without the others
            </Button>
          </Flex>
        </SettingsSection>
      </Show>
    </Flex>
  );
};
