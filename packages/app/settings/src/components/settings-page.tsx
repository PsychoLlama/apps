import { Callout, Container, Flex, Heading, NoScript, Text } from '@lib/ui';
import IconAlert from 'virtual:icons/mdi/alert-outline';
import { ThemeSettings } from './theme-settings';
import { AppearanceSettings } from './appearance-settings';
import { MotionSettings } from './motion-settings';
import { AdvancedSettings } from './advanced-settings';

/**
 * Body of the settings page. Each section reads and writes its own
 * preference; the Advanced section holds a subscription with a lifetime
 * of its own.
 */
export const SettingsPage = () => (
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

      <Flex as="section" direction="column">
        <AdvancedSettings />
      </Flex>
    </Flex>
  </Container>
);
