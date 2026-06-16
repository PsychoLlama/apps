import { Callout, Container, Section, Text } from '@lib/ui';
import { SiteHeader } from '@lib/shell';

export const Logs = () => (
  <>
    <SiteHeader title="Logs" />

    <Section size={3}>
      <Container as="div" size={2} px={4}>
        <Callout color="neutral">
          <Text as="span" size={2} selectable={false}>
            Work in progress.
          </Text>
        </Callout>
      </Container>
    </Section>
  </>
);
