import { Container, Flex, Heading, Section, Text } from '@lib/ui';
import { SiteHeader } from '@lib/shell';
import { ThemePicker, themeHeadingId } from './theme-picker';

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

          <Flex as="section" direction="column" gap={3}>
            <Heading as="h2" id={themeHeadingId} size={4} weight="medium">
              Theme
            </Heading>

            <ThemePicker />
          </Flex>
        </Flex>
      </Container>
    </Section>
  </Flex>
);
