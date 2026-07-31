import { Show } from 'solid-js';
import { useValue } from '@lib/state';
import { Flex, Text } from '@lib/ui';
import {
  connectionStore,
  focusedPeerFormula,
  type ConnectionStatus,
  type ShareState,
} from '../state/session';
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
 * Where the peer connection stands, in one word. The six states collapse to
 * four: a dial that hasn't started yet is indistinguishable from one in
 * flight to anyone watching, and a device that never answered and one that
 * hung up are both, from here, simply not there.
 */
const describePeer = (state: ShareState): string => {
  switch (state) {
    case 'preparing':
    case 'connecting':
      return 'Connecting';
    case 'awaiting':
      return 'Waiting';
    case 'connected':
      return 'Connected';
    case 'unreachable':
    case 'disconnected':
      return 'Offline';
  }
};

/**
 * The sentence behind the word, kept as the reading's title. The one-word
 * form is what fits in a bar; this is the part that says what to do about it,
 * and which of the two ways a peer came to be offline this one was.
 */
const explainPeer = (state: ShareState): string => {
  switch (state) {
    case 'preparing':
      return 'Getting ready to connect…';
    case 'connecting':
      return 'Connecting…';
    case 'awaiting':
      return 'Waiting for them to accept. Keep this device awake.';
    case 'connected':
      return 'Paired. Ready to share.';
    case 'unreachable':
      return 'Couldn’t reach this device. It may be offline.';
    case 'disconnected':
      return 'Disconnected. Anything you write will reach them when they’re back.';
  }
};

/**
 * The session's status bar along the foot of every `/beam/*` route. Reports
 * the relay connection in words rather than the glyph the header used to
 * carry: the state is a sentence — connecting, connected, gone — and a small
 * icon in a corner asks the reader to have learned it.
 *
 * The trailing edge holds the peer being connected to, and only while there
 * is one. It's the same class of fact as the relay reading — chrome about the
 * session rather than about the page — so the two sit on one line, this
 * device's own footing on the left and the far end's on the right.
 *
 * Both are `<output>`s, which are implicit `status` live regions, so a
 * reading is announced as it changes rather than sitting there for someone to
 * go and find. Each carries the longer form as its title: the relay's is
 * which server is holding it, the peer's is the sentence the single word
 * stands in for.
 */
export const StatusBar = () => {
  const connection = useValue(connectionStore);
  const peer = useValue(focusedPeerFormula);

  return (
    <Flex
      as="footer"
      direction="row"
      align="center"
      justify="between"
      gap={3}
      class={styles.bar}
    >
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

      <Show when={peer()}>
        {(view) => (
          <output
            data-testid="beam-peer-status"
            class={styles.status}
            title={explainPeer(view().state)}
          >
            {/* The name is the peer's own suggestion until the reader renames
                it, so it's rendered as a string and never as markup — the
                same rule the pairing prompt is held to. */}
            <Text
              as="span"
              size={1}
              color="lowContrast"
              class={styles.peerName}
              selectable={false}
            >
              {view().name}:
            </Text>
            <Text as="span" size={1} weight="medium" selectable={false}>
              {describePeer(view().state)}
            </Text>
          </output>
        )}
      </Show>
    </Flex>
  );
};
