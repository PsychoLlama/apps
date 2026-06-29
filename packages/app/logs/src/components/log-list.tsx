import { Callout, Container, Flex, Heading, Text } from '@lib/ui';
import { LogsView } from './logs-view';

/**
 * The log archive index at `/logs`. The viewer that lists this device's
 * persisted sessions is still to come — for now the page stands in with a
 * work-in-progress callout under the breadcrumb.
 */
export const LogList = () => (
  <LogsView trail={[{ label: 'Logs' }]}>
    <Container as="div" size={2}>
      <Flex as="div" direction="column" gap={6}>
        <Flex as="header" direction="column" gap={2}>
          <Heading as="h1" size={7} selectable={false}>
            Logs
          </Heading>
          <Text as="p" size={3} color="lowContrast" selectable={false}>
            Session logs are stored locally on your device. They aren't shared
            unless you explicitly allow it.
          </Text>
        </Flex>

        <Callout color="neutral">
          <Text as="span" size={2} selectable={false}>
            Work in progress.
          </Text>
        </Callout>
      </Flex>
    </Container>
  </LogsView>
);
