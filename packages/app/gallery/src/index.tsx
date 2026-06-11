import { Container, Flex, Heading, Text } from '@lib/ui';
import { SiteHeader } from '@lib/shell';

export const Gallery = () => {
  return (
    <Flex as="main" direction="column" grow>
      <SiteHeader title="Gallery" />

      <Container as="section" size={2} px={5} py={6}>
        <Flex as="hgroup" direction="column" gap={3}>
          <Heading as="h1" size={7} trim="start">
            Hello, world
          </Heading>
          <Text as="p" size={3} color="lowContrast" trim="end">
            The gallery is just getting started. Component and token browsing
            lands here soon.
          </Text>
        </Flex>
      </Container>
    </Flex>
  );
};
