import { Frame, FrameBody, SiteHeader } from '@lib/shell';

/** Beam home at `/`. An empty frame until the rebuild fills it in. */
const BeamHome = () => (
  <Frame>
    <SiteHeader />
    <FrameBody />
  </Frame>
);

export default BeamHome;
