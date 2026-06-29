import { Callout, Text } from '@lib/ui';
import { LogsView } from './logs-view';

/**
 * The log archive index at `/logs`. Lists this device's persisted sessions —
 * a wide, full-bleed view (no reading-width cap) for the table to come. For
 * now there's nothing to list, so it stands in with an empty-state callout.
 */
export const LogList = () => (
  <LogsView trail={[{ label: 'Logs' }]}>
    <Callout color="neutral">
      <Text as="span" size={2} selectable={false}>
        No logs found.
      </Text>
    </Callout>
  </LogsView>
);
