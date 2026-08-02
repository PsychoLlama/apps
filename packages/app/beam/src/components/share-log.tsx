import { For, Show } from 'solid-js';
import { useRun, useValue } from '@lib/state';
import { Badge, Button, Card, Flex, LinkButton, Text } from '@lib/ui';
import IconContentCopy from 'virtual:icons/mdi/content-copy';
import IconOpenInNew from 'virtual:icons/mdi/open-in-new';
import { reportSagaFailure } from '../state/failure';
import { shareLink } from '../state/share-body';
import { copyNoticeStore, copyShareSaga, type Share } from '../state/shares';
import * as styles from './share-log.css';

/** Times read as times. Follows the reader's locale. */
const formatTime = (epochMilliseconds: number): string =>
  new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(
    epochMilliseconds,
  );

/**
 * One thing shared, in either direction. The body is the row; everything
 * else — who, when, whether it's still waiting to go out — is chrome around
 * it.
 *
 * Copy and Open are offered on every row rather than only on the ones that
 * arrived. Re-copying something you sent from the device you sent it from is
 * exactly what someone reaching for this page is doing, and withholding the
 * button on the grounds that they typed it once already would be a rule with
 * nothing behind it.
 */
const ShareRow = (props: { share: Share; peerName: string }) => {
  const notice = useValue(copyNoticeStore);
  const copy = useRun(copyShareSaga);

  /** The URL this share is, if it's a URL at all. */
  const link = () => shareLink(props.share.body);

  /** Whether this row is the one that was just copied. */
  const copied = () => notice().shareId === props.share.id;

  const handleCopy = () => {
    void copy({ id: props.share.id, body: props.share.body }).catch(
      reportSagaFailure('The share copy saga failed.'),
    );
  };

  return (
    <Card as="li" size={2}>
      <Flex as="div" direction="column" gap={2}>
        <Flex as="div" direction="row" align="center" justify="between" gap={3}>
          <Text
            as="span"
            size={1}
            color="lowContrast"
            class={styles.author}
            truncate
            selectable={false}
          >
            {props.share.status === 'received' ? props.peerName : 'You'}
          </Text>

          <Flex as="div" direction="row" align="center" gap={2}>
            {/* Only ours can be waiting. A queued row is the one thing on
                this page that hasn't happened yet, so it says so. */}
            <Show when={props.share.status === 'queued'}>
              <Badge color="warning" variant="soft">
                Queued
              </Badge>
            </Show>

            <Text as="span" size={1} color="lowContrast" selectable={false}>
              {formatTime(props.share.at)}
            </Text>
          </Flex>
        </Flex>

        {/* Selectable, and rendered as text. A received body came off the
            wire from another device — one the reader vouched for, which is
            not the same as one they control — so it is never markup, and the
            only thing offered to act on it is a link the scheme allowlist
            has already vetted. */}
        <Text as="p" size={2} class={styles.body} selectable>
          {props.share.body}
        </Text>

        <Flex as="div" direction="row" gap={2} justify="end" wrap="wrap">
          <Show when={link()}>
            {(href) => (
              <LinkButton
                testId="beam-share-open"
                href={href()}
                native
                target="_blank"
                rel="noreferrer noopener"
                size={1}
                variant="soft"
              >
                <IconOpenInNew width="16" height="16" aria-hidden="true" />
                Open
              </LinkButton>
            )}
          </Show>

          <Button
            testId="beam-share-copy"
            size={1}
            variant="soft"
            color="neutral"
            onClick={handleCopy}
          >
            <IconContentCopy width="16" height="16" aria-hidden="true" />
            {copied() ? 'Copied' : 'Copy'}
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
};

/**
 * Everything shared with one peer this session, oldest first so the newest
 * sits nearest the composer below it. Renders nothing when empty — the page
 * says what it's for elsewhere, and an empty log needs no frame around it.
 *
 * The log is memory-only, and deliberately: a share is a hand-off between
 * two devices in the same room, not a conversation to come back to. Closing
 * the app is how you clear it.
 */
export const ShareLog = (props: { shares: Share[]; peerName: string }) => (
  <Show when={props.shares.length > 0}>
    <Flex
      as="ul"
      direction="column"
      gap={2}
      data-testid="beam-share-log"
      aria-label="Shared this session"
    >
      <For each={props.shares}>
        {(share) => <ShareRow share={share} peerName={props.peerName} />}
      </For>
    </Flex>
  </Show>
);
