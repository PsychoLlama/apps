import { Frame, FrameBody, SiteHeader } from '@lib/shell';
import { SettingsPage } from '../components/settings-page';

/** The settings page, framed by the shell. */
const Settings = () => (
  <Frame>
    <SiteHeader title="Settings" />

    <FrameBody>
      <SettingsPage />
    </FrameBody>
  </Frame>
);

export default Settings;
