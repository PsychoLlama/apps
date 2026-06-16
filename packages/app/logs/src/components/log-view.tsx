import { createMemo } from 'solid-js';
import { useParams } from '@solidjs/router';
import { Callout, Container, Text } from '@lib/ui';
import { formatSessionLabel } from '../format';
import { LogsView } from './logs-view';

/**
 * A single session's page at `/logs/:file`. The viewer itself is still to come
 * — for now it stands in with a work-in-progress callout under a breadcrumb
 * that names the session you landed on.
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
        <Callout color="neutral">
          <Text as="span" size={2} selectable={false}>
            Work in progress.
          </Text>
        </Callout>
      </Container>
    </LogsView>
  );
};
