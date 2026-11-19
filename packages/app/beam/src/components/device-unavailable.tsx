import { Match, Switch } from 'solid-js';
import { useValue } from '@lib/effects/solid';
import { Callout, Text } from '@lib/ui';
import { $device } from '../state';

/**
 * Why there's no app to show, when there isn't one: another tab has the
 * device, or it couldn't be opened. Renders nothing otherwise.
 */
export const DeviceUnavailable = () => {
  const device = useValue($device);

  return (
    <Switch>
      <Match when={device().status === 'elsewhere'}>
        <Callout testId="device-elsewhere" color="neutral">
          <Text as="p" selectable>
            Beam is open in another tab. This one takes over when that tab
            closes.
          </Text>
        </Callout>
      </Match>

      <Match when={device().status === 'failed'}>
        <Callout testId="device-failed" color="danger">
          <Text as="p" selectable>
            Beam couldn't open its storage on this device. Reload to try again.
          </Text>
        </Callout>
      </Match>
    </Switch>
  );
};
