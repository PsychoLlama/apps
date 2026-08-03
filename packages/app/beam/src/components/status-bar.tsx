import { useValue } from '@lib/state';
import { Flex, Text } from '@lib/ui';
import { connectionStore, type ConnectionStatus } from '../state/network';
import * as styles from './status-bar.css';

/** Where the relay connection stands, in the word a reader would use. */
const describeRelay = (status: ConnectionStatus): string => {
  switch (status) {
    case 'connecting':
      return 'Connecting';
    case 'connected':
      return 'Connected';
    case 'failed':
      return 'Disconnected';
  }
};

/**
 * The session's status bar along the foot of every `/beam/*` route. Reports
 * the relay connection in words rather than the glyph the header used to
 * carry: the state is a sentence — connecting, connected, gone — and a small
 * icon in a corner asks the reader to have learned it.
 *
 * The relay is all it reports. It's the one thing here that belongs to the
 * session rather than to a page: it holds whether this device can be reached
 * at all, it's true on every route, and nothing on screen says it. Where a
 * particular peer stands is a fact about the page that peer is open on, and
 * the share view already carries it — beside the composer, next to what
 * reading it would change.
 *
 * An `<output>`, which is an implicit `status` live region, so the reading is
 * announced as it changes rather than sitting there for someone to go and
 * find. Its title is which server is holding the connection.
 */
export const StatusBar = () => {
  const connection = useValue(connectionStore);

  return (
    <Flex as="footer" direction="row" align="center" gap={3} class={styles.bar}>
      <output
        data-testid="beam-relay-status"
        class={styles.status}
        title={connection().homeRelay ?? undefined}
      >
        <Text as="span" size={1} color="lowContrast" selectable={false}>
          Relay:
        </Text>
        <Text as="span" size={1} weight="medium" selectable={false}>
          {describeRelay(connection().status)}
        </Text>
      </output>
    </Flex>
  );
};
