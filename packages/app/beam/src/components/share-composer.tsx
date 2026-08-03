import { useCommit, useRun, useValue } from '@lib/state';
import { Flex, IconButton, TextField } from '@lib/ui';
import IconSend from 'virtual:icons/mdi/send-outline';
import { reportSagaFailure } from '../state/failure';
import { shareTextSaga } from '../state/network';
import { SHARE_MAX_LENGTH } from '../state/share-body';
import { draftChangedTopic, draftsStore } from '../state/shares';

/**
 * Where text and links are written, at the head of a peer's share view.
 *
 * It's usable before the peer is reachable, which is the whole reason the
 * log has a queued state: writing a note to a device that's asleep is a
 * normal thing to want, and a composer that refuses until the other end
 * wakes up would make the reader the retry loop. The send control says which
 * of the two is about to happen — "Send" when the peer is there to receive
 * it, "Queue" when it's going to wait.
 *
 * One line rather than a box. A share is an address, a password, a link —
 * the length of a line, not of a paragraph — and a three-row textarea sized
 * the field for the rarest case and left the common one sitting in mostly
 * empty space. It also asked to be aimed at: a box that size reads as
 * somewhere to compose, and this is somewhere to paste.
 *
 * The draft lives in the scope rather than the field, so wandering off to
 * another peer and back doesn't quietly discard a half-written note.
 *
 * A real `<form>`, so sending goes through the one path the browser already
 * understands: the submit button submits it, Enter from the field does too
 * by implicit submission, and both arrive at the same handler. A `<div>`
 * with a click handler would have to reimplement each of those, and would
 * get the keyboard one wrong by omission.
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

  /** Whitespace is nothing to share, so the control won't offer to send it. */
  const empty = () => body().trim().length === 0;

  /** What the send control is about to do, as the name it's announced by. */
  const action = () => (props.connected ? 'Send' : 'Queue');

  /**
   * Sent from the draft rather than from `FormData`. The scope already holds
   * what was typed — it has to, so the note survives navigating away — and
   * reading the field back would make a second source of truth out of the
   * one the saga is about to clear.
   */
  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    if (empty()) return;

    void share({ endpointId: props.endpointId, body: body() }).catch(
      reportSagaFailure('The share saga failed.'),
    );
  };

  return (
    <Flex as="form" direction="column" gap={2} onSubmit={handleSubmit}>
      {/* `maxlength` is a courtesy to whoever is typing; the cap that
          matters is enforced where the share is stored, and again at the
          decoder for anything arriving the other way.

          Sending rides in the field rather than under it. It acts on what
          the field holds and nothing else, so it belongs to the field the
          way the clear button on a search box does — and it costs the
          composer a row, which matters on the page where the log is what
          the reader came to see.

          Icon-only, and named by what it's about to do. The word it would
          otherwise carry changes with the connection, and a label that
          rewrites itself under the pointer is worse than a glyph that
          doesn't move. */}
      <TextField
        testId="beam-share-composer"
        aria-label="Something to share"
        placeholder="Type or paste something to share"
        size={3}
        value={body()}
        onInput={(event) =>
          commit(
            draftChangedTopic({
              endpointId: props.endpointId,
              body: event.currentTarget.value,
            }),
          )
        }
        maxlength={SHARE_MAX_LENGTH}
        autocomplete={undefined}
        autocapitalize="sentences"
        enterkeyhint="send"
        right={
          <IconButton
            testId="beam-share-send"
            type="submit"
            aria-label={action()}
            title={action()}
            variant="ghost"
            color="neutral"
            disabled={empty()}
          >
            <IconSend aria-hidden="true" />
          </IconButton>
        }
      />
    </Flex>
  );
};
