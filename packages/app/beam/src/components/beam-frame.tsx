import { children, Show, type JSX } from 'solid-js';
import { useValue } from '@lib/effects/solid';
import { Frame, FrameBody, SiteHeader, type SiteHeaderCrumb } from '@lib/shell';
import { Flex } from '@lib/ui';
import { $device } from '../state';
import { DeviceStatus } from './device-status';
import { DeviceUnavailable } from './device-unavailable';

/**
 * The frame every beam page renders in: the header with this device's
 * status, and the page's body once there's a device to show it for.
 *
 * The device opens once the client mounts, and the body waits for it:
 * the frame is prerendered, the contents are not.
 */
export const BeamFrame = (props: {
  /** Where this page sits below the app's root crumb. */
  trail?: SiteHeaderCrumb[];

  /** The page's own controls, in the header after the device's status. */
  actions?: JSX.Element;

  /**
   * Held to the bottom of the frame, under the scrolling body, once the
   * device is open.
   */
  footer?: JSX.Element;

  /**
   * Laid over the whole frame, header and all, once the device is open.
   * Rendered last, so it paints over the rest.
   */
  overlay?: JSX.Element;

  /** The page, shown once the device is open. */
  children: JSX.Element;
}) => {
  const device = useValue($device);
  const open = () => device().status === 'open';

  // Read once: a JSX prop builds a new element on every access.
  const footer = children(() => (open() ? props.footer : undefined));

  return (
    <Frame>
      <SiteHeader
        trail={props.trail}
        actions={
          // Ghost buttons pull their padding back with negative margins,
          // so the gap is what keeps their hover areas apart.
          <Flex as="div" align="center" gap={5}>
            <DeviceStatus />
            <Show when={open()}>{props.actions}</Show>
          </Flex>
        }
      />

      <FrameBody>
        <DeviceUnavailable />
        <Show when={open()}>{props.children}</Show>
      </FrameBody>

      <Show when={footer()}>
        <Flex as="footer" direction="column" px={5} py={4}>
          {footer()}
        </Flex>
      </Show>

      <Show when={open()}>{props.overlay}</Show>
    </Frame>
  );
};
