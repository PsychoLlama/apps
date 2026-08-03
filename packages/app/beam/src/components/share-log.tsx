import { For, Show } from 'solid-js';
import { Badge, Flex, Heading, Link, Text } from '@lib/ui';
import IconArrowDown from 'virtual:icons/mdi/arrow-down';
import IconArrowUp from 'virtual:icons/mdi/arrow-up';
import { shareLink } from '../state/share-body';
import { type Share } from '../state/shares';
import * as styles from './share-log.css';

/** Times read as times. Follows the reader's locale. */
const formatTime = (epochMilliseconds: number): string =>
  new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(
    epochMilliseconds,
  );

/**
 * One thing on the surface, in either direction. The body is the item;
 * everything else — which way it went, when, whether it's still waiting — is
 * a line of chrome under it.
 *
 * Nothing here is a button. The body is selectable text, and a URL is the
 * link itself — which between them is every way there is to take one of
 * these. A Copy control alongside that was a second path to what selecting
 * already does, and it cost every item a filled rectangle to say so.
 */
const ShareRow = (props: { share: Share; peerName: string }) => {
  /** The URL this share is, if it's a URL at all. */
  const link = () => shareLink(props.share.body);

  /** Whether this one arrived rather than left. */
  const inbound = () => props.share.status === 'received';

  return (
    <Flex as="li" direction="row" align="start" gap={3} class={styles.row}>
      {/* The arrow carries what a name used to, so it carries the name's
          accessible text with it: an icon alone would leave a screen reader
          with the body and no idea which device put it there. */}
      <Show
        when={inbound()}
        fallback={
          <IconArrowUp
            role="img"
            aria-label="Shared by you"
            class={styles.direction}
          />
        }
      >
        <IconArrowDown
          role="img"
          aria-label={`Shared by ${props.peerName}`}
          class={styles.direction}
        />
      </Show>

      <Flex
        as="div"
        direction="column"
        gap={1}
        grow
        class={styles.content}
        data-testid="beam-share-item"
      >
        {/* Selectable, and rendered as text. A received body came off the
            wire from another device — one the reader vouched for, which is
            not the same as one they control — so it is never markup. A body
            that is entirely a URL becomes the link itself rather than
            growing an Open button beside it: the thing on screen is the
            address, so the address is what you click. The `href` is the
            allowlisted URL, not the raw body, so `javascript:` and `data:`
            never reach an anchor. */}
        <Text as="p" size={2} class={styles.body} selectable>
          <Show when={link()} fallback={props.share.body}>
            {(href) => (
              <Link
                testId="beam-share-open"
                href={href()}
                native
                target="_blank"
                rel="noreferrer noopener"
                selectable
              >
                {props.share.body}
              </Link>
            )}
          </Show>
        </Text>

        <Flex as="div" direction="row" align="center" gap={2}>
          <Text as="span" size={1} color="lowContrast" selectable={false}>
            {formatTime(props.share.at)}
          </Text>

          {/* Only ours can be waiting. A queued item is the one thing on
              this surface that hasn't happened yet, so it says so. */}
          <Show when={props.share.status === 'queued'}>
            <Badge color="warning" variant="soft">
              Queued
            </Badge>
          </Show>
        </Flex>
      </Flex>
    </Flex>
  );
};

/**
 * Everything shared with one peer this session — one surface the two devices
 * put things down on, newest first so the last thing shared sits nearest the
 * composer above it.
 *
 * It reads as a region rather than a feed, which is the correction it exists
 * to make. Framing each item in its own card made a page of things addressed
 * to somebody, and nothing here is: a share is a hand-off between two devices
 * in the same room, not a conversation. One bordered zone with the items ruled
 * off inside it says what actually happened — these things were put here, in
 * this order, and either of us can pick them up.
 *
 * Renders nothing when empty. The page says what it's for elsewhere, and an
 * empty zone would be a box outlining the absence of anything to take from it.
 *
 * The log is memory-only, and deliberately: closing the app is how you clear
 * the surface.
 */
export const ShareLog = (props: { shares: Share[]; peerName: string }) => (
  <Show when={props.shares.length > 0}>
    <Flex as="section" direction="column" gap={2}>
      {/* The zone is named out loud rather than left to be inferred. A
          bordered region under a text field reads as another field until
          something tells you otherwise, and "this session" is the part worth
          saying: what's here goes away when the app is closed. */}
      <Heading
        as="h2"
        size={1}
        weight="medium"
        color="lowContrast"
        selectable={false}
      >
        Shared this session
      </Heading>

      <Flex
        as="ul"
        direction="column"
        background="surface"
        class={styles.zone}
        data-testid="beam-share-log"
        aria-label="Shared this session"
      >
        <For each={props.shares}>
          {(share) => <ShareRow share={share} peerName={props.peerName} />}
        </For>
      </Flex>
    </Flex>
  </Show>
);
