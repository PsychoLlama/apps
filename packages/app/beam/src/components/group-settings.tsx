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
import { NameField } from './name-field';

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
        description="Everyone in the group sees this."
      >
        <NameField
          testId="group-name"
          label="Group name"
          value={props.group.name}
          placeholder={groupLabel({ name: '' })}
          maxLength={GROUP_NAME_MAX_LENGTH}
          onSave={(name) => renameGroup(props.group.id, name)}
        />
      </SettingsSection>

      <SettingsSection
        title="Device name"
        headingId="device-name-heading"
        description="How this device appears to the others."
      >
        <NameField
          testId="device-name"
          label="Device name"
          value={props.group.deviceName}
          maxLength={DEVICE_NAME_MAX_LENGTH}
          onSave={(name) => renameDevice(name)}
        />
      </SettingsSection>

      <SettingsSection
        title="Devices"
        headingId="devices-heading"
        description="Removing a device can take a while if others are offline."
      >
        <MemberList groupId={props.group.id} />
      </SettingsSection>

      <SettingsSection
        title="Leave group"
        headingId="leave-heading"
        description="Deletes this group from this device. The other devices keep it."
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
          title="Lost a device?"
          headingId="replace-heading"
          description="If a device is gone for good, move what's here to a new group with only this device in it. You can connect the others again afterward."
        >
          <Flex as="div">
            <Button
              testId="group-replace"
              variant="soft"
              color="danger"
              disabled={replaceGroup.pending}
              onClick={() => replaceGroup(props.group.id)}
            >
              Move to a new group
            </Button>
          </Flex>
        </SettingsSection>
      </Show>
    </Flex>
  );
};
