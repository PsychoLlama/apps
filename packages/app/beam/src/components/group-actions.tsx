import { useAction } from '@lib/effects/solid';
import { IconButton, LinkButton, Tooltip } from '@lib/ui';
import IconLink from 'virtual:icons/mdi/cellphone-link';
import IconSettings from 'virtual:icons/mdi/cog-outline';
import { $openInvite } from '../effects';

/**
 * A group's controls in the header: link a device, and the group's
 * settings. Both are rare, so they're icons out of the way of the feed.
 */
export const GroupActions = (props: {
  /** The group they act on. */
  groupId: string;
}) => {
  const openInvite = useAction($openInvite);

  return (
    <>
      <Tooltip
        testId="group-invite-tooltip"
        display="inline"
        side="bottom"
        align="end"
        content="Link a device"
      >
        {(trigger) => (
          <IconButton
            {...trigger}
            testId="group-invite"
            aria-label="Link a device"
            variant="ghost"
            color="neutral"
            disabled={openInvite.pending}
            onClick={() => openInvite(props.groupId)}
          >
            <IconLink aria-hidden="true" />
          </IconButton>
        )}
      </Tooltip>

      <Tooltip
        testId="group-settings-tooltip"
        display="inline"
        side="bottom"
        align="end"
        content="Settings"
      >
        {(trigger) => (
          <LinkButton
            {...trigger}
            testId="group-settings-open"
            href={`/group/${props.groupId}/settings`}
            aria-label="Settings"
            variant="ghost"
            color="neutral"
          >
            <IconSettings width="18" height="18" aria-hidden="true" />
          </LinkButton>
        )}
      </Tooltip>
    </>
  );
};
