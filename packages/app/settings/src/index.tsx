import { NoHydration } from 'solid-js/web';
import { Callout, Container, Flex, Heading, Section, Text } from '@lib/ui';
import { SiteHeader } from '@lib/shell';
import IconAlert from 'virtual:icons/mdi/alert-outline';
import { AppearancePicker, appearanceHeadingId } from './appearance-picker';
import { ThemePicker, ThemeResetButton, themeHeadingId } from './theme-picker';

export const Settings = () => (
  <Flex as="main" direction="column" grow>
    <SiteHeader title="Settings" />

    <Section size={3}>
      <Container as="div" size={2} px={4}>
        <Flex as="div" direction="column" gap={5}>
          <Flex as="header" direction="column" gap={2}>
            <Heading as="h1" size={6} weight="medium">
              Settings
            </Heading>
            <Text as="p" size={2} color="lowContrast">
              Tune how the apps look and behave.
            </Text>
          </Flex>

          <NoHydration>
            <noscript>
              <Callout color="warning" icon={<IconAlert />}>
                <Text as="span" size={2}>
                  These controls need JavaScript. Enable it to change any of the
                  settings on this page.
                </Text>
              </Callout>
            </noscript>
          </NoHydration>

          <Flex as="section" direction="column" gap={3}>
            <Flex as="header" direction="column" gap={2}>
              <Heading
                as="h2"
                id={appearanceHeadingId}
                size={4}
                weight="medium"
              >
                Appearance
              </Heading>
              <Text as="p" size={2} color="lowContrast">
                Choose light, dark, or follow your system preference.
              </Text>
            </Flex>

            <AppearancePicker />
          </Flex>

          <Flex as="section" direction="column" gap={3}>
            <Flex as="header" direction="column" gap={2}>
              <Flex
                as="div"
                direction="row"
                justify="between"
                align="center"
                gap={3}
              >
                <Heading as="h2" id={themeHeadingId} size={4} weight="medium">
                  Theme
                </Heading>
                <ThemeResetButton />
              </Flex>
              <Text as="p" size={2} color="lowContrast">
                Sets the app's primary color.
              </Text>
            </Flex>

            <ThemePicker />
          </Flex>
        </Flex>
      </Container>
    </Section>
  </Flex>
);
