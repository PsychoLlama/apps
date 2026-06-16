import { createMemo } from 'solid-js';
import { useParams } from '@solidjs/router';
import { Callout, Code, Container, Flex, Text } from '@lib/ui';
import { formatSessionLabel } from '../format';
import { LogsView } from './logs-view';

/**
 * A single session's page at `/logs/:file`. The viewer itself is still to come
 * — for now it confirms which file you landed on and stands in with a
 * work-in-progress callout.
 */
export const LogView = () => {
  const params = useParams<{ file: string }>();
  const file = createMemo(() => decodeURIComponent(params.file));

  return (
    <LogsView
      trail={[
        { label: 'Logs', href: '/logs' },
        { label: formatSessionLabel(file()) },
      ]}
    >
      <Container as="div" size={2}>
        <Flex as="div" direction="column" gap={4}>
          <Code size={2} color="neutral" truncate>
            {file()}
          </Code>
          <Callout color="neutral">
            <Text as="span" size={2} selectable={false}>
              Work in progress.
            </Text>
          </Callout>
        </Flex>
      </Container>
    </LogsView>
  );
};
