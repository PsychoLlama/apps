import { useClientValue } from '@lib/effects/solid';
import { Frame, FrameBody, SiteHeader } from '@lib/shell';
import { Container } from '@lib/ui';
import { DeviceStatus } from '../components/device-status';
import { DeviceUnavailable } from '../components/device-unavailable';
import { $openDevice } from '../effects';

/**
 * Beam home at `/`.
 *
 * Holding the device is the only lifecycle wiring here. Neither the worker
 * nor IndexedDB can run during SSG, so it opens once the client mounts.
 */
const BeamHome = () => {
  useClientValue($openDevice);

  return (
    <Frame>
      <SiteHeader actions={<DeviceStatus />} />

      <FrameBody>
        <Container as="div" size={1}>
          <DeviceUnavailable />
        </Container>
      </FrameBody>
    </Frame>
  );
};

export default BeamHome;
