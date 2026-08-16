import { FrameBody, SiteHeader } from '@lib/shell';

/**
 * The scratchpad landing page: a deliberately blank canvas at
 * `/scratchpad`, wired up to the site chrome and nothing else. Start an
 * experiment by writing straight into the body, or give it its own route
 * alongside this one.
 */
const ScratchpadHome = () => (
  <>
    <SiteHeader title="Scratchpad" />
    <FrameBody />
  </>
);

export default ScratchpadHome;
