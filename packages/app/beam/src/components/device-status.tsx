import { Show } from 'solid-js';
import { useValue } from '@lib/effects/solid';
import { Text, Tooltip } from '@lib/ui';
import IconOnline from 'virtual:icons/mdi/cloud-check-outline';
import IconOffline from 'virtual:icons/mdi/cloud-off-outline';
import { $device, isOnline } from '../state';
import * as styles from './header.css';

/**
 * Whether this device can reach others right now, as an icon, with the
 * word on hover. Renders nothing until the device is open: before that
 * "offline" would be a guess.
 *
 * An icon and not a badge. Being online is the ordinary state, and being
 * offline isn't an error: what's shared waits. Neither asks for attention.
 */
export const DeviceStatus = () => {
  const device = useValue($device);
  const label = () => (isOnline(device()) ? 'Online' : 'Offline');

  return (
    <Show when={device().status === 'open'}>
      <Tooltip
        testId="device-status-tooltip"
        display="block"
        side="bottom"
        align="end"
        content={label()}
      >
        {(trigger) => (
          <Text
            {...trigger}
            as="span"
            size={2}
            role="img"
            tabIndex={0}
            color="lowContrast"
            selectable={false}
            aria-label={label()}
            testId="device-status"
            class={styles.icon}
          >
            <Show
              when={isOnline(device())}
              fallback={<IconOffline aria-hidden="true" />}
            >
              <IconOnline aria-hidden="true" />
            </Show>
          </Text>
        )}
      </Tooltip>
    </Show>
  );
};
