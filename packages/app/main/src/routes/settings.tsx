import {
  Button,
  Callout,
  Container,
  Flex,
  Heading,
  NoScript,
  Text,
} from '@lib/ui';
import { Frame, FrameBody, SiteHeader } from '@lib/shell';
import {
  AppearanceSettings,
  LogFilterSettings,
  LogStorageSettings,
  MotionSettings,
  ThemeSettings,
} from '@app/settings/components';
import IconAlert from 'virtual:icons/mdi/alert-outline';
import IconChevron from 'virtual:icons/mdi/chevron-right';
import * as css from './settings.css';

/**
 * The settings page. Each group reads and writes its own preference.
 * Debugging and preview controls sit in an "Advanced" disclosure that's
 * collapsed by default.
 */
const Settings = () => (
  <Frame>
    <SiteHeader title="Settings" />

    <FrameBody>
      <Container as="div" size={2}>
        <Flex as="div" direction="column" gap={5}>
          <Flex as="header" direction="column" gap={2}>
            <Heading as="h1" size={6} weight="medium" selectable={false}>
              Settings
            </Heading>
            <Text as="p" size={2} color="lowContrast" selectable={false}>
              Tune how the apps look and behave.
            </Text>
          </Flex>

          <NoScript>
            <Callout color="warning" icon={<IconAlert />}>
              <Text as="span" size={2} selectable={false}>
                These controls need JavaScript. Enable it to change any of the
                settings on this page.
              </Text>
            </Callout>
          </NoScript>

          <ThemeSettings />
          <AppearanceSettings />
          <MotionSettings />

          <Flex as="details" direction="column" gap={5}>
            <Button
              as="summary"
              variant="ghost"
              color="neutral"
              class={css.summary}
              testId="advanced-disclosure"
            >
              <Heading as="h2" size={4} weight="medium" selectable={false}>
                Advanced
              </Heading>
              <IconChevron
                width="20"
                height="20"
                aria-hidden="true"
                class={css.chevron}
              />
            </Button>

            {/* `details` lays out its content as one slotted box, so its
                own gap never reaches the groups. This column spaces them. */}
            <Flex as="div" direction="column" gap={5}>
              <LogFilterSettings />
              <LogStorageSettings />
            </Flex>
          </Flex>
        </Flex>
      </Container>
    </FrameBody>
  </Frame>
);

export default Settings;
