import { useAction } from '@lib/effects/solid';
import { Flex, IconButton, TextField } from '@lib/ui';
import IconAttach from 'virtual:icons/mdi/paperclip';
import IconSend from 'virtual:icons/mdi/send-outline';
import { $shareFiles, $shareItem } from '../effects';
import { ITEM_MAX_LENGTH } from '../state';
import * as styles from './composer.css';

/**
 * Where a note, a link, or a file is shared, held to the bottom of a
 * group's feed the way a chat's is.
 *
 * It works offline and alone. What's shared is written to this device
 * first and reaches the group's other devices whenever they're reachable,
 * so there's nothing here to wait for but a large file being read in.
 *
 * One line rather than a box: what gets shared is an address, a code, a
 * link. This is somewhere to paste, not somewhere to compose.
 *
 * Files come in here two ways: picked, or pasted. A drop is the whole
 * page's to take: see `DropTarget`.
 *
 * A real `<form>`, so Enter in the field and the button arrive at the same
 * handler. Uncontrolled, and cleared on submit.
 */
export const Composer = (props: {
  /** The group this shares to. */
  groupId: string;
}) => {
  const shareItem = useAction($shareItem);
  const shareFiles = useAction($shareFiles);

  let picker: HTMLInputElement | undefined;

  /** Share whatever files a pick or a paste carried. */
  const share = (files: FileList | null | undefined): boolean => {
    if (!files || files.length === 0) return false;

    shareFiles(props.groupId, [...files]);
    return true;
  };

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
        placeholder="Type, paste, or drop something to share"
        size={3}
        maxlength={ITEM_MAX_LENGTH}
        autocomplete="off"
        autocapitalize="sentences"
        enterkeyhint="send"
        onPaste={(event) => {
          // A pasted file is shared at once. Pasted text lands in the
          // field as it always did.
          if (share(event.clipboardData?.files)) event.preventDefault();
        }}
        left={
          <IconButton
            testId="composer-attach"
            type="button"
            aria-label="Share files"
            variant="ghost"
            color="neutral"
            // One batch at a time: they're read in one after another.
            disabled={shareFiles.pending}
            onClick={() => picker?.click()}
          >
            <IconAttach aria-hidden="true" />
          </IconButton>
        }
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

      {/* The platform's picker, behind the button. Not part of the form's
          data: a pick is shared as it's made. */}
      <input
        ref={(element) => {
          picker = element;
        }}
        class={styles.picker}
        type="file"
        multiple
        tabindex={-1}
        aria-hidden="true"
        data-testid="composer-files"
        onChange={(event) => {
          share(event.currentTarget.files);
          event.currentTarget.value = '';
        }}
      />
    </Flex>
  );
};
