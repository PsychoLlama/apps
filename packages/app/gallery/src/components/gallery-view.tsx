import { type JSX } from 'solid-js';
import { AppearanceToggle } from '@app/settings/components';
import { Frame, FrameBody, SiteHeader, type SiteHeaderCrumb } from '@lib/shell';
import { LinkButton } from '@lib/ui';
import IconCog from 'virtual:icons/mdi/cog-outline';

/**
 * A gallery view: a `<main>` frame with a breadcrumb header over the
 * scrollable content region. Each route renders one — `trail` names where you
 * are past the app's root crumb (empty on the landing page, `<manifest>` on a
 * manifest page), and the content fills and scrolls below it.
 */
export const GalleryView = (props: {
  trail?: SiteHeaderCrumb[];
  children?: JSX.Element;
}) => (
  <Frame>
    <SiteHeader
      trail={props.trail}
      actions={
        <>
          <AppearanceToggle />
          <LinkButton
            testId="settings"
            href="/settings"
            aria-label="Settings"
            variant="ghost"
            color="neutral"
          >
            <IconCog width="24" height="24" />
          </LinkButton>
        </>
      }
    />
    <FrameBody as="article">{props.children}</FrameBody>
  </Frame>
);
