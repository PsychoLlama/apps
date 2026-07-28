import { useCommit, useRun } from '@lib/state';
import { Button, Callout, Flex, Text } from '@lib/ui';
import IconAccountQuestion from 'virtual:icons/mdi/account-question-outline';
import type { ContactView } from '../state/contacts';
import {
  acceptPairingSaga,
  requestDismissedTopic,
  reportSagaFailure,
} from '../state/session';

/**
 * One peer asking to pair, with the two answers to it. Used wherever a
 * request can be answered — the banner over the address book and the
 * contact's own page — so the question reads the same in both, and there's
 * one place to change what it costs to say yes.
 *
 * The name is the peer's own suggestion until the reader renames it, so it's
 * treated as untrusted text: rendered as a string, never as markup, and
 * capped in length before it ever reaches the address book. The endpoint key
 * on the contact page is the part that can't be spoofed, which is why "Not
 * now" leaves the contact in place rather than resolving anything — the
 * decision can be made there, against the key.
 */
export const PairingRequest = (props: {
  /** The peer waiting on an answer. */
  contact: ContactView;
  /** Distinguishes the banner's controls from the contact page's. */
  testId: string;
}) => {
  const accept = useRun(acceptPairingSaga);
  const commit = useCommit();

  const handleAccept = () => {
    void accept(props.contact.endpointId).catch(
      reportSagaFailure('The pairing accept saga failed.'),
    );
  };

  return (
    <Callout
      testId={props.testId}
      color="accent"
      icon={<IconAccountQuestion width="20" height="20" aria-hidden="true" />}
    >
      {/* The name is selectable and the copy around it isn't: the name is
          the one piece of data here, and it's the piece worth checking
          against the key on the contact's page. */}
      <Text as="p" size={2} selectable={false}>
        <Text as="span" size={2} weight="medium" selectable>
          {props.contact.name}
        </Text>{' '}
        wants to pair with this device.
      </Text>

      <Flex as="div" direction="row" gap={2} justify="end" wrap="wrap">
        {/* Refusing is inaction, so the label says what it does: the ask
            goes away, the peer keeps waiting, and nothing is granted. */}
        <Button
          testId={`${props.testId}-dismiss`}
          variant="soft"
          color="neutral"
          onClick={() =>
            commit(requestDismissedTopic(props.contact.endpointId))
          }
        >
          Not now
        </Button>
        <Button testId={`${props.testId}-accept`} onClick={handleAccept}>
          Accept
        </Button>
      </Flex>
    </Callout>
  );
};
