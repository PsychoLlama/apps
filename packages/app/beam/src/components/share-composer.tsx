import { Show } from 'solid-js';
import { useCommit, useRun, useValue } from '@lib/state';
import { Button, Flex, Text, TextArea } from '@lib/ui';
import IconSend from 'virtual:icons/mdi/send-outline';
import {
  draftChangedTopic,
  draftsStore,
  reportSagaFailure,
  SHARE_MAX_LENGTH,
  shareTextSaga,
} from '../state/session';

/**
 * Where text and links are written, at the foot of a peer's share view.
 *
 * It's usable before the peer is reachable, which is the whole reason the
 * log has a queued state: writing a note to a device that's asleep is a
 * normal thing to want, and a composer that refuses until the other end
 * wakes up would make the reader the retry loop. The button says which of
 * the two is about to happen — "Send" when the peer is there to receive it,
 * "Queue" when it's going to wait.
 *
 * The draft lives in the scope rather than the field, so wandering off to
 * the contact's record and back doesn't quietly discard a half-written note.
 */
export const ShareComposer = (props: {
  /** The peer this is addressed to. */
  endpointId: string;
  /** Whether the peer can receive it right now. */
  connected: boolean;
}) => {
  const drafts = useValue(draftsStore);
  const commit = useCommit();
  const share = useRun(shareTextSaga);

  const body = () => drafts().bodies[props.endpointId] ?? '';

  /** Whitespace is nothing to share, so the button won't offer to. */
  const empty = () => body().trim().length === 0;

  const handleShare = () => {
    void share({ endpointId: props.endpointId, body: body() }).catch(
      reportSagaFailure('The share saga failed.'),
    );
  };

  return (
    <Flex as="div" direction="column" gap={3}>
      {/* `maxlength` is a courtesy to whoever is typing; the cap that
          matters is enforced where the share is stored, and again at the
          decoder for anything arriving the other way. */}
      <TextArea
        testId="beam-share-composer"
        aria-label="Something to share"
        placeholder="Type or paste something to share"
        value={body()}
        onInput={(event) =>
          commit(
            draftChangedTopic({
              endpointId: props.endpointId,
              body: event.currentTarget.value,
            }),
          )
        }
        rows={3}
        resize="vertical"
        maxlength={SHARE_MAX_LENGTH}
        autocomplete={undefined}
        autocapitalize="sentences"
        enterkeyhint={undefined}
      />

      <Flex
        as="div"
        direction="row"
        align="center"
        justify={props.connected ? 'end' : 'between'}
        gap={3}
      >
        {/* Only said when it's true, and only about the thing the reader is
            about to do. A permanent note about connection state belongs to
            the status line at the top of the page. */}
        <Show when={!props.connected}>
          <Text as="span" size={1} color="lowContrast" selectable={false}>
            They’ll get this when they’re back.
          </Text>
        </Show>

        <Button
          testId="beam-share-send"
          onClick={handleShare}
          disabled={empty()}
        >
          <IconSend width="18" height="18" aria-hidden="true" />
          {props.connected ? 'Send' : 'Queue'}
        </Button>
      </Flex>
    </Flex>
  );
};
