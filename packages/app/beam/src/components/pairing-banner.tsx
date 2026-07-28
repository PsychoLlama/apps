import { Show } from 'solid-js';
import { useValue } from '@lib/state';
import { Flex } from '@lib/ui';
import { PairingRequest } from './pairing-request';
import { pairingRequestsFormula } from '../state/session';
import * as styles from './pairing-banner.css';

/**
 * Peers waiting on an answer, shown over whatever `/beam/*` route is open.
 * A request arrives unprompted — the reader is looking at the address book,
 * or a share view, or nothing at all — so it can't live on a page they'd
 * have to already be on.
 *
 * Only the oldest is shown. Several at once is a rare, adversarial-looking
 * situation, and a stack of questions is a worse way to meet it than one
 * question at a time; the rest are one tap away in the address book, where
 * each sits against its own endpoint key. A list of them is Phase 6's
 * problem.
 */
export const PairingBanner = () => {
  const requests = useValue(pairingRequestsFormula);

  return (
    <Show when={requests()[0]}>
      {(request) => (
        <Flex
          as="aside"
          direction="column"
          class={styles.tray}
          aria-label="Pairing request"
        >
          <PairingRequest testId="beam-pairing-banner" contact={request()} />
        </Flex>
      )}
    </Show>
  );
};
