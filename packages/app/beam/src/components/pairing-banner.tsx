import { For, Show } from 'solid-js';
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
 * Every outstanding request is stacked here, oldest first, rather than one
 * at a time: a request hidden behind another is one nobody knows to look
 * for, and answering the visible one would make the next appear in the same
 * spot — the second tap landing on a question the reader hasn't read yet.
 * The tray scrolls rather than growing without bound, so a pile of them
 * can't take the page with it.
 */
export const PairingBanner = () => {
  const requests = useValue(pairingRequestsFormula);

  return (
    <Show when={requests().length > 0}>
      <Flex
        as="aside"
        direction="column"
        gap={3}
        class={styles.tray}
        aria-label="Pairing requests"
      >
        <For each={requests()}>
          {(request) => (
            <PairingRequest testId="beam-pairing-banner" contact={request} />
          )}
        </For>
      </Flex>
    </Show>
  );
};
