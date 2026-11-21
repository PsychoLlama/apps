import { useNavigate } from '@solidjs/router';
import { useAction } from '@lib/effects/solid';
import { IconButton, Tooltip } from '@lib/ui';
import IconLink from 'virtual:icons/mdi/cellphone-link';
import IconSettings from 'virtual:icons/mdi/cog-outline';
import { $openInvite } from '../effects';
import * as styles from './header.css';

/**
 * A group's controls in the header: connect a device, and the group's
 * settings. Both are rare, so they're icons out of the way of the feed.
 *
 * Both are the same kind of button so they sit alike, though one of them
 * navigates.
 */
export const GroupActions = (props: {
  /** The group they act on. */
  groupId: string;
}) => {
  const navigate = useNavigate();
  const openInvite = useAction($openInvite);

  return (
    <>
      <Tooltip
        testId="group-invite-tooltip"
        display="block"
        side="bottom"
        align="end"
        content="Connect a device"
      >
        {(trigger) => (
          <IconButton
            {...trigger}
            testId="group-invite"
            aria-label="Connect a device"
            variant="ghost"
            color="neutral"
            class={styles.icon}
            disabled={openInvite.pending}
            onClick={() => openInvite(props.groupId)}
          >
            <IconLink aria-hidden="true" />
          </IconButton>
        )}
      </Tooltip>

      <Tooltip
        testId="group-settings-tooltip"
        display="block"
        side="bottom"
        align="end"
        content="Settings"
      >
        {(trigger) => (
          <IconButton
            {...trigger}
            testId="group-settings-open"
            aria-label="Settings"
            variant="ghost"
            color="neutral"
            class={styles.icon}
            onClick={() => navigate(`/group/${props.groupId}/settings`)}
          >
            <IconSettings aria-hidden="true" />
          </IconButton>
        )}
      </Tooltip>
    </>
  );
};
