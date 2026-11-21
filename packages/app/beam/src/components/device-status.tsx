import { Show } from 'solid-js';
import { useValue } from '@lib/effects/solid';
import { Badge, Text } from '@lib/ui';
import { $device, connectionOf, type Connection } from '../state';
import * as styles from './device-status.css';

/** What each state is called. */
const LABELS: Record<Connection, string> = {
  connecting: 'Connecting',
  online: 'Online',
  offline: 'Offline',
};

/**
 * Whether this device can reach others right now: a word, and a dot
 * after it in the state's color.
 *
 * A badge and not an icon. Everything else in the header is a button,
 * and an icon among them reads as one more. A badge is plainly a label.
 * It stays neutral whatever the state: being offline isn't an error,
 * what's shared waits, and only the dot changes.
 *
 * Renders nothing when the device isn't this tab's to speak for.
 */
export const DeviceStatus = () => {
  const device = useValue($device);
  const connection = () => connectionOf(device());

  return (
    <Show when={connection()}>
      {(state) => (
        <Badge
          color="neutral"
          variant="soft"
          radius="full"
          size={2}
          role="status"
          data-testid="device-status"
          data-state={state()}
        >
          {LABELS[state()]}
          <Text
            as="span"
            selectable={false}
            class={styles.dot[state()]}
            aria-hidden="true"
          />
        </Badge>
      )}
    </Show>
  );
};
