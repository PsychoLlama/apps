import { Show } from 'solid-js';
import { useValue } from '@lib/effects/solid';
import { Text, Tooltip } from '@lib/ui';
import IconOnline from 'virtual:icons/mdi/cloud-check-outline';
import IconOffline from 'virtual:icons/mdi/cloud-off-outline';
import { $device, isOnline } from '../state';

/** Enough of an id to tell two devices apart at a glance. */
const fingerprint = (id: string): string => id.slice(0, 8);

/**
 * Whether this device can reach others right now, as an icon, with the
 * words and its identity on hover. Renders nothing until the device is
 * open: before that there's no identity to show, and "offline" would be a
 * guess.
 *
 * An icon and not a badge. Being online is the ordinary state, and being
 * offline isn't an error: what's shared waits. Neither asks for attention.
 */
export const DeviceStatus = () => {
  const device = useValue($device);
  const label = () => (isOnline(device()) ? 'Online' : 'Offline');

  return (
    <Show when={device().status === 'open' && device().id}>
      {(id) => (
        <Tooltip
          testId="device-status-tooltip"
          display="inline"
          side="bottom"
          align="end"
          content={`${label()}. This device: ${fingerprint(id())}`}
        >
          {(trigger) => (
            <Text
              {...trigger}
              as="span"
              role="img"
              tabIndex={0}
              color="lowContrast"
              selectable={false}
              aria-label={label()}
              testId="device-status"
              data-online={isOnline(device())}
            >
              <Show
                when={isOnline(device())}
                fallback={
                  <IconOffline width="20" height="20" aria-hidden="true" />
                }
              >
                <IconOnline width="20" height="20" aria-hidden="true" />
              </Show>
            </Text>
          )}
        </Tooltip>
      )}
    </Show>
  );
};
