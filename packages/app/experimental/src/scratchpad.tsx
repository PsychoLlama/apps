import { Frame, FrameBody, SiteHeader } from '@lib/shell';

/** The experimental scratchpad surface — a wired-up blank canvas. */
export const Scratchpad = () => {
  return (
    <Frame>
      <SiteHeader title="Experimental" />
      <FrameBody />
    </Frame>
  );
};
