import { Show } from 'solid-js';
import { useValue } from '@lib/effects/solid';
import { Badge, Tooltip } from '@lib/ui';
import { $device, isOnline } from '../state';

/** Enough of an id to tell two devices apart at a glance. */
const fingerprint = (id: string): string => id.slice(0, 8);

/**
 * Whether this device can reach others right now, with its identity on
 * hover. Renders nothing until the device is open: before that there's no
 * identity to show, and "offline" would be a guess.
 */
export const DeviceStatus = () => {
  const device = useValue($device);

  return (
    <Show when={device().status === 'open' && device().id}>
      {(id) => (
        <Tooltip
          testId="device-status-tooltip"
          display="inline"
          side="bottom"
          align="end"
          content={`This device: ${fingerprint(id())}`}
        >
          {(trigger) => (
            <Badge
              {...trigger}
              tabIndex={0}
              testId="device-status"
              color={isOnline(device()) ? 'success' : 'neutral'}
            >
              {isOnline(device()) ? 'Online' : 'Offline'}
            </Badge>
          )}
        </Tooltip>
      )}
    </Show>
  );
};
