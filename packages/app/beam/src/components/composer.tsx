import { useAction } from '@lib/effects/solid';
import { Flex, IconButton, TextField } from '@lib/ui';
import IconSend from 'virtual:icons/mdi/send-outline';
import { $shareItem } from '../effects';
import { ITEM_MAX_LENGTH } from '../state';

/**
 * Where a note or a link is written, at the head of a group's feed.
 *
 * It works offline and alone. What's shared is written to this device
 * first and reaches the group's other devices whenever they're reachable,
 * so there's nothing here to wait for and no state to report.
 *
 * One line rather than a box: what gets shared is an address, a code, a
 * link. This is somewhere to paste, not somewhere to compose.
 *
 * A real `<form>`, so Enter in the field and the button arrive at the same
 * handler. Uncontrolled, and cleared on submit.
 */
export const Composer = (props: {
  /** The group this shares to. */
  groupId: string;
}) => {
  const shareItem = useAction($shareItem);

  const handleSubmit = (
    event: SubmitEvent & { currentTarget: HTMLFormElement },
  ) => {
    event.preventDefault();

    const form = event.currentTarget;
    const body = new FormData(form).get('body');
    if (typeof body !== 'string' || body.trim().length === 0) return;

    shareItem(props.groupId, body);
    form.reset();
  };

  return (
    <Flex as="form" direction="column" onSubmit={handleSubmit}>
      <TextField
        testId="composer"
        name="body"
        aria-label="Something to share"
        placeholder="Type or paste something to share"
        size={3}
        maxlength={ITEM_MAX_LENGTH}
        autocomplete="off"
        autocapitalize="sentences"
        enterkeyhint="send"
        right={
          <IconButton
            testId="composer-send"
            type="submit"
            aria-label="Share"
            variant="ghost"
            color="neutral"
          >
            <IconSend aria-hidden="true" />
          </IconButton>
        }
      />
    </Flex>
  );
};
