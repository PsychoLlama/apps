import { Container, Flex, Heading, Section, Text } from '@lib/ui';
import { SiteHeader } from '@lib/shell';

export const Settings = () => (
  <Flex as="main" direction="column" grow>
    <SiteHeader title="Settings" />

    <Section size={3}>
      <Container as="div" size={2}>
        <Flex as="div" direction="column" gap={5}>
          <Flex as="header" direction="column" gap={2}>
            <Heading as="h1" size={6} weight="medium">
              Settings
            </Heading>
            <Text as="p" size={2} color="lowContrast">
              Tune how the apps look and behave.
            </Text>
          </Flex>

          <Flex as="section" direction="column" gap={2}>
            <Heading as="h2" size={4} weight="medium">
              Theme
            </Heading>
            <Text as="p" size={2} color="lowContrast">
              TODO: surface theme controls (accent, mode) once the tokens are
              pluggable at runtime.
            </Text>
          </Flex>
        </Flex>
      </Container>
    </Section>
  </Flex>
);
