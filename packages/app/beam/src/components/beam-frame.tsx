import { Show, type JSX } from 'solid-js';
import { useClientValue, useValue } from '@lib/effects/solid';
import { Frame, FrameBody, SiteHeader, type SiteHeaderCrumb } from '@lib/shell';
import { Container } from '@lib/ui';
import { $openDevice } from '../effects';
import { $device } from '../state';
import { DeviceStatus } from './device-status';
import { DeviceUnavailable } from './device-unavailable';

/**
 * The frame every beam page renders in: the header with this device's
 * status, and the page's body once there's a device to show it for.
 *
 * Holding the device is the only lifecycle wiring. Neither the worker nor
 * IndexedDB can run during SSG, so it opens once the client mounts, and
 * the body waits for it: the frame is prerendered, the contents are not.
 */
export const BeamFrame = (props: {
  /** Where this page sits below the app's root crumb. */
  trail?: SiteHeaderCrumb[];

  /** The page, shown once the device is open. */
  children: JSX.Element;
}) => {
  useClientValue($openDevice);
  const device = useValue($device);

  return (
    <Frame>
      <SiteHeader trail={props.trail} actions={<DeviceStatus />} />

      <FrameBody>
        <Container as="div" size={1}>
          <DeviceUnavailable />
          <Show when={device().status === 'open'}>{props.children}</Show>
        </Container>
      </FrameBody>
    </Frame>
  );
};
